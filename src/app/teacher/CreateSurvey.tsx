import { useMemo, useState } from "react";
import { nanoid } from "nanoid";

type QuestionType =
  | "short"
  | "paragraph"
  | "multiple"
  | "yesno"
  | "scale";

interface BaseQuestion {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  type: QuestionType;
}

interface ShortQuestion extends BaseQuestion {
  type: "short" | "paragraph";
}

interface MultipleQuestion extends BaseQuestion {
  type: "multiple";
  options: string[];
}

interface YesNoQuestion extends BaseQuestion {
  type: "yesno";
  askFollowUpOnYes?: boolean;
  followUpQuestionIds?: string[];
}

interface ScaleQuestion extends BaseQuestion {
  type: "scale";
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

type SurveyQuestion =
  | ShortQuestion
  | MultipleQuestion
  | YesNoQuestion
  | ScaleQuestion;

interface SurveyBuilderPayload {
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

const newQuestion = (type: QuestionType = "short"): SurveyQuestion => {
  const id = nanoid();

  switch (type) {
    case "paragraph":
      return {
        id,
        type,
        title: "",
        description: "",
        required: false,
      };
    case "multiple":
      return {
        id,
        type,
        title: "",
        description: "",
        required: false,
        options: ["", ""],
      };
    case "yesno":
      return {
        id,
        type,
        title: "",
        description: "",
        required: false,
        askFollowUpOnYes: false,
        followUpQuestionIds: [],
      };
    case "scale":
      return {
        id,
        type,
        title: "",
        description: "",
        required: false,
        min: 1,
        max: 5,
        minLabel: "",
        maxLabel: "",
      };
    case "short":
    default:
      return {
        id,
        type: "short",
        title: "",
        description: "",
        required: false,
      };
  }
};

export default function CreateSurvey() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    newQuestion("short"),
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo<SurveyBuilderPayload>(
    () => ({
      title,
      description,
      questions,
    }),
    [title, description, questions]
  );

  const updateQuestion = (id: string, patch: Partial<SurveyQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? ({ ...q, ...patch } as SurveyQuestion) : q))
    );
  };

  const changeType = (id: string, type: QuestionType) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const replacement = newQuestion(type);
        return {
          ...replacement,
          id: q.id,
          title: q.title,
          description: q.description,
          required: q.required,
        };
      })
    );
  };

  const addQuestion = (type: QuestionType = "short") => {
    setQuestions((prev) => [...prev, newQuestion(type)]);
  };

  const duplicateQuestion = (id: string) => {
    const original = questions.find((q) => q.id === id);
    if (!original) return;

    const clone = JSON.parse(JSON.stringify(original)) as SurveyQuestion;
    clone.id = nanoid();

    if (clone.type === "yesno") {
      clone.followUpQuestionIds = [];
    }

    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id);
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q) => {
          if (q.type !== "yesno") return q;
          return {
            ...q,
            followUpQuestionIds: (q.followUpQuestionIds || []).filter(
              (followId) => followId !== id
            ),
          };
        })
    );
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id);
      if (index === -1) return prev;

      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addOption = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id && q.type === "multiple"
          ? { ...q, options: [...q.options, ""] }
          : q
      )
    );
  };

  const updateOption = (id: string, index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id || q.type !== "multiple") return q;
        const options = [...q.options];
        options[index] = value;
        return { ...q, options };
      })
    );
  };

  const removeOption = (id: string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id || q.type !== "multiple") return q;
        const options = q.options.filter((_, i) => i !== index);
        return { ...q, options: options.length >= 2 ? options : ["", ""] };
      })
    );
  };

  const toggleFollowUp = (yesNoQuestionId: string, targetQuestionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== yesNoQuestionId || q.type !== "yesno") return q;

        const current = q.followUpQuestionIds || [];
        const exists = current.includes(targetQuestionId);

        return {
          ...q,
          askFollowUpOnYes: true,
          followUpQuestionIds: exists
            ? current.filter((id) => id !== targetQuestionId)
            : [...current, targetQuestionId],
        };
      })
    );
  };

  const validateSurvey = () => {
    if (!title.trim()) return "Survey title is required.";
    if (questions.length === 0) return "At least one question is required.";

    for (const q of questions) {
      if (!q.title.trim()) return "Every question must have a title.";

      if (q.type === "multiple") {
        const validOptions = q.options.filter((opt) => opt.trim());
        if (validOptions.length < 2) {
          return "Multiple choice questions need at least two options.";
        }
      }

      if (q.type === "scale") {
        if (q.min >= q.max) {
          return "Scale question minimum must be smaller than maximum.";
        }
        if (![5, 10].includes(q.max)) {
          return "Scale questions currently support 1–5 or 1–10.";
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    setError(null);
    setMessage(null);

    const validationError = validateSurvey();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      console.log("Survey payload:", payload);
      setMessage("Survey draft prepared successfully.");
    } catch (e: any) {
      setError(e?.message || "Failed to save survey.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Create Survey</h1>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Survey title"
          className="mb-3 w-full rounded-md border p-3 text-lg"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Survey description"
          rows={3}
          className="w-full rounded-md border p-3"
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl bg-white p-5 shadow">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-500">
                Question {idx + 1}
              </span>

              <div className="flex flex-wrap gap-2">
                <select
                  value={q.type}
                  onChange={(e) => changeType(q.id, e.target.value as QuestionType)}
                  className="rounded-md border p-2"
                >
                  <option value="short">Short answer</option>
                  <option value="paragraph">Paragraph</option>
                  <option value="multiple">Multiple choice</option>
                  <option value="yesno">Yes / No</option>
                  <option value="scale">Linear scale</option>
                </select>

                <button
                  onClick={() => moveQuestion(q.id, "up")}
                  className="rounded-md border px-3 py-2"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveQuestion(q.id, "down")}
                  className="rounded-md border px-3 py-2"
                >
                  ↓
                </button>
                <button
                  onClick={() => duplicateQuestion(q.id)}
                  className="rounded-md border px-3 py-2"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="rounded-md border px-3 py-2 text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>

            <input
              value={q.title}
              onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
              placeholder="Question title"
              className="mb-3 w-full rounded-md border p-3"
            />

            <input
              value={q.description || ""}
              onChange={(e) =>
                updateQuestion(q.id, { description: e.target.value })
              }
              placeholder="Optional description"
              className="mb-4 w-full rounded-md border p-3"
            />

            {q.type === "multiple" && (
              <div className="mb-4 space-y-2">
                {q.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => updateOption(q.id, i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 rounded-md border p-2"
                    />
                    <button
                      onClick={() => removeOption(q.id, i)}
                      className="rounded-md border px-3 py-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addOption(q.id)}
                  className="text-sm font-medium text-blue-600"
                >
                  + Add option
                </button>
              </div>
            )}

            {q.type === "yesno" && (
              <div className="mb-4 rounded-lg border bg-gray-50 p-4">
                <label className="mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={q.askFollowUpOnYes || false}
                    onChange={(e) =>
                      updateQuestion(q.id, {
                        askFollowUpOnYes: e.target.checked,
                        followUpQuestionIds: e.target.checked
                          ? q.followUpQuestionIds || []
                          : [],
                      })
                    }
                  />
                  <span>Ask extra follow-up question(s) when answer is Yes</span>
                </label>

                {q.askFollowUpOnYes && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Choose follow-up questions:
                    </p>

                    {questions
                      .filter((candidate) => candidate.id !== q.id)
                      .map((candidate) => (
                        <label
                          key={candidate.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={
                              q.followUpQuestionIds?.includes(candidate.id) || false
                            }
                            onChange={() => toggleFollowUp(q.id, candidate.id)}
                          />
                          <span>{candidate.title || "Untitled question"}</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>
            )}

            {q.type === "scale" && (
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Range
                  </label>
                  <select
                    value={q.max}
                    onChange={(e) =>
                      updateQuestion(q.id, {
                        min: 1,
                        max: Number(e.target.value),
                      } as Partial<SurveyQuestion>)
                    }
                    className="w-full rounded-md border p-2"
                  >
                    <option value={5}>1 to 5</option>
                    <option value={10}>1 to 10</option>
                  </select>
                </div>

                <div className="flex items-end text-sm text-gray-600">
                  Preview: {q.min} — {q.max}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Left label
                  </label>
                  <input
                    value={q.minLabel || ""}
                    onChange={(e) =>
                      updateQuestion(
                        q.id,
                        { minLabel: e.target.value } as Partial<SurveyQuestion>
                      )
                    }
                    placeholder="e.g. Poor"
                    className="w-full rounded-md border p-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Right label
                  </label>
                  <input
                    value={q.maxLabel || ""}
                    onChange={(e) =>
                      updateQuestion(
                        q.id,
                        { maxLabel: e.target.value } as Partial<SurveyQuestion>
                      )
                    }
                    placeholder="e.g. Excellent"
                    className="w-full rounded-md border p-2"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={q.required || false}
                onChange={(e) =>
                  updateQuestion(q.id, { required: e.target.checked })
                }
              />
              Required question
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => addQuestion("short")}
          className="rounded-md border px-4 py-2"
        >
          + Short
        </button>
        <button
          onClick={() => addQuestion("paragraph")}
          className="rounded-md border px-4 py-2"
        >
          + Paragraph
        </button>
        <button
          onClick={() => addQuestion("multiple")}
          className="rounded-md border px-4 py-2"
        >
          + Multiple Choice
        </button>
        <button
          onClick={() => addQuestion("yesno")}
          className="rounded-md border px-4 py-2"
        >
          + Yes / No
        </button>
        <button
          onClick={() => addQuestion("scale")}
          className="rounded-md border px-4 py-2"
        >
          + Linear Scale
        </button>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {message && <p className="mt-4 text-green-600">{message}</p>}

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Survey"}
        </button>
      </div>
    </div>
  );
}