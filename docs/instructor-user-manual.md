# Instructor User Manual: Oral Response to Transcript System

## 1. System Overview

Amplify LMS supports oral response assignments where instructors create prompts and students submit spoken answers. The system records or uploads student audio in the browser, sends the audio to the backend transcription pipeline, and returns a transcript that becomes the student's saved response.

This manual covers the oral response to transcript workflow only. It does not cover automatic grading as a primary feature.

In the current active workflow:

- Instructors create assignments with one or more oral response questions.
- Students open a shared assignment link and record oral responses.
- The backend transcribes each oral response.
- The student submits the assignment with the transcript text saved as the response.
- Instructors review submitted transcripts in View Submissions.

Important: the current active system saves transcript text with the submission. It does not reliably save original audio recordings as part of the normal student submission workflow.

## 2. Instructor Login

1. Open the Amplify LMS login page.
2. Enter the instructor email address and password provided for your account.
3. Select Login.
4. After login, the system opens the Teacher Dashboard.

If login fails:

- Confirm that the email address is typed correctly.
- Confirm that the account has been provisioned in Supabase Auth.
- Confirm that the password is correct.
- Contact the project administrator if the account is not recognized.

## 3. Instructor Access and Account Approval

Instructor access is managed through Supabase Auth. Instructor accounts must be approved or provisioned by the project administrator before use.

Selected instructor access currently depends on administrator-controlled account setup in Supabase Auth. In production use, instructors should only use accounts that have been created, invited, or approved by the project administrator.

Current access behavior:

- A valid Supabase login session is required for instructor dashboard pages.
- Backend assignment and submission endpoints verify the instructor's Supabase token.
- Assignments are associated with the instructor account that created them.
- Instructors can view submissions only for assignments owned by their own account.

Current limitation:

- The app does not currently provide a separate in-app instructor approval dashboard or allowlist screen. Instructor selection and approval should be handled operationally by the project administrator in Supabase Auth.

## 4. Creating an Oral Assignment

1. Log in as an instructor.
2. Open Create Assignment from the instructor sidebar.
3. Enter the assignment title.
4. Enter student instructions.
5. Optionally set a due date.
6. Optionally set an assignment-level timer.
7. In the Questions section, choose Oral response for a question.
8. Enter the prompt students should answer orally.
9. Optionally set a question time limit.
10. Optionally add point values, expected answer notes, or rubric guidance for instructor review.
11. Add additional questions as needed.

To add more oral response questions:

1. Select Add question: Oral.
2. Enter the new prompt.
3. Repeat for each oral response item.

Before publishing, verify:

- The assignment title is complete.
- Student instructions are clear.
- Each question has prompt text.
- Oral response time limits are appropriate for the expected answer length.

## 5. Publishing and Sharing an Assignment Link

1. When the assignment is ready, select Save & Publish.
2. The system saves the assignment to the backend under the logged-in instructor account.
3. After publishing, the page displays a student assignment link.
4. Select Copy Link to copy the link.
5. Share the link with students through the course communication channel used by your class.

Student links use this pattern:

```text
/student/{assignmentId}
```

Students do not need an instructor login to open a shared assignment link.

## 6. Student Oral Response Submission Workflow

Students complete oral assignments through the shared assignment link.

Student steps:

1. Open the assignment link.
2. Enter full name.
3. Enter J-number.
4. Select Start Test.
5. Read each prompt.
6. For oral response questions, select Start Recording.
7. Speak the response.
8. Select Stop Recording, or allow the timer to stop recording automatically.
9. Wait for the transcript to appear.
10. Review the transcript shown on screen.
11. Continue to the next question.
12. Select Submit on the final question.

How transcription works:

- The browser records the student's audio.
- The audio is sent to the backend transcription endpoint.
- The backend sends the audio to the configured OpenAI transcription model.
- The backend returns transcript text to the frontend.
- The transcript is displayed to the student and stored in the assignment response when submitted.

What data is saved:

- Assignment ID
- Student name
- Student J-number
- Written answers, if any
- Multiple-choice answers, if any
- Oral response transcripts
- Submission timestamp

Current active behavior: the saved submission includes transcript text. Original audio recordings are not preserved as the standard saved artifact in the current active workflow.

## 7. Viewing Student Submissions and Transcripts

1. Log in as an instructor.
2. Open View Submissions from the instructor sidebar.
3. Review the list of assignments and submissions.
4. Select a student submission.
5. For each oral response question, review the Oral Response Transcript section.

The transcript shown in View Submissions is the text saved from the student's oral response. This is the primary review artifact for the current oral response system.

Instructors can also see:

- Student name
- J-number
- Assignment title
- Submission timestamp
- Written or multiple-choice answers, if included
- Student transcript accuracy feedback, if the student submitted it

## 8. Transcript Download / Export Notes

Transcript CSV or bulk export is not currently available in the active system unless a separate export feature is implemented.

Current options:

- View transcripts inside View Submissions.
- Manually copy transcript text from the submission detail view if needed.

Audio download notes:

- The current active student workflow saves transcripts, not original audio recordings.
- Some submission review screens include original recording controls and download links for responses that contain audio URLs.
- In the current active oral response workflow, instructors should not assume original audio files will be available for download.

## 9. Current System Limitations

- Transcript text is saved as the primary oral response artifact.
- Original audio recording persistence is not part of the normal active submission flow.
- Transcript CSV or bulk export is not currently available.
- Students access assignments through public assignment links and do not log in.
- Instructor approval is handled through Supabase Auth administration, not an in-app approval queue.
- Browser microphone access is required for recording.
- Transcription depends on backend availability and OpenAI transcription service availability.
- Media attached while creating a question may be preview-only unless separate persistent media upload support is implemented.

## 10. Troubleshooting

### Instructor cannot log in

1. Verify the email and password.
2. Confirm the instructor account exists in Supabase Auth.
3. Ask the project administrator to confirm the account is active.

### Instructor can log in but cannot save an assignment

1. Confirm the session has not expired.
2. Refresh the page and log in again if needed.
3. Confirm required assignment fields are complete.
4. Contact the project administrator if the issue continues.

### Student cannot open an assignment link

1. Confirm the full link was copied correctly.
2. Confirm the assignment was published successfully.
3. Ask the instructor to copy the link again from View Submissions or the publish confirmation.

### Student microphone does not work

1. Confirm the browser has microphone permission.
2. Confirm the device has a working microphone.
3. Try a supported modern browser such as Chrome, Edge, or Safari.
4. Refresh the assignment page after changing microphone permissions.

### Transcript does not appear

1. Wait for the upload and transcription process to finish.
2. Check the internet connection.
3. Try recording again.
4. If the issue persists, the backend transcription service or OpenAI transcription service may be unavailable.

### Student submitted but instructor does not see the response

1. Confirm the student selected Submit on the final question.
2. Confirm the student did not already submit with the same J-number for the same assignment.
3. Refresh View Submissions.
4. Confirm the instructor is logged in with the same account that created the assignment.

## 11. Support / Contact Notes

For instructor account access, assignment ownership issues, or production configuration questions, contact the project administrator responsible for Supabase Auth and deployment settings.

When requesting support, include:

- Instructor email address
- Assignment title
- Assignment link or assignment ID
- Student name and J-number, if the issue involves a submission
- Browser and device used
- A short description of what happened and when it happened

Do not send passwords, Supabase service role keys, OpenAI API keys, or other secrets in support messages.
