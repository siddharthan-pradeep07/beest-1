# What a Good Review Looks Like

Hey gang! Thank you for taking the time to read this and for offering to help with project review. Reviewing properly is amazingly helpful and will take a lot of work off my plate, but reviewing badly can actually lead to my budget getting fined or people getting the wrong payouts, feedback or results.

In my experience, long review times or unclear review feedback is a big pain point for participants, so this doc should explain how to do review perfectly :)

## The Overall Goal

Your role as a reviewer is to make the final call as to if someones project is worthy of a reward, needs changes to become worthy, or is an attempt to misrepresent effort or defraud the system. For the most part, you are looking at many hours of peoples invested time, so where possible always assume good faith. Equally, incompetence is far more common than ill intent.

Ultimately balancing the time it takes to review all projects with the quality of feedback provided and the amount of fraud caught is a matter of taste / opinion. So here is my opinion!

- Participant experience comes first! The number one goal is for people to feel that the reviewers are there to help them make the project good and that they are not holding them back from shipping faster. We are not here to enforce rigorous arbitrary standards, rather use good judgement. If somebody is new to GH, sloppy commit history is justifiable; if they are experienced, hold them to higher standards!

- The second most important element is that the reviews are of high quality. We have a long checklist which I will go over in more detail, but as set out above, a bad review costs us time and money, so be thorough!

- The third highest priority is time. If it takes time to review well, that's okay. I'd rather have a slow good process than a fast bad one.

## So what is a good review?

When making a review you will have 3 options :)

- **Approve**: the project works exactly as described, it shows real learning, challenge or creativity, and the hours tracked are reasonable for the features of the project.

- **Reject (`changes_needed`)**: the project doesn't meet our standards! **Feedback is required**, and the Reject button is disabled until the user feedback box has text, because this is the message the builder sees. If we are rejecting a project it should be very clear why it was rejected and should have actionable feedback for the user to resubmit and be accepted.

- **Fail & Ban**: the user has blatantly attempted to defraud the system beyond the doubt of good faith. This should be backed up by evidence and a history of interactions wherein the user has not shown intent to do better after making what could be passed off as an honest mistake. Run this one by me before using it!

Every review also writes a `ProjectReview` row with your feedback, internal note, override justification, and hour adjustments. Past reviews on the same project are visible underneath the review panel, so read them before you start.

## Before you form an opinion, read the Hackatime panel

The Hackatime context panel (visible while the project is `unreviewed` or `approved`) exists to save you from being fooled. Work through it top to bottom:

- **Trust level badge**: `blue` is standard, `red` is banned. Something has broken if you see red — pass it on to me!

- **Email mismatch warning**: "The linked Hackatime user does not contain this builder's email" strongly suggests a shared or alt account. Treat as a blocker and pass on to euan unless explained.

- **Hackatime banned**: don't approve, full stop. Pass it on to me.

- **Unified Airtable duplicate**: the code URL already exists in Unified Approved Projects. Someone else already got paid for this, or the builder is resubmitting across programs. Investigate before approving; the user should have reported that the project is submitted to another program. This is only acceptable when significant updates have been made and only shipped to beest.

- **Previous approved hours + delta**: on resubmissions, this tells you what was *already* paid out. The delta is what you're about to grant on top, so make sure it is indicative of substantial work (check commit history!)

- **Hackatime projects breakdown**: the listed project names and languages should line up with the actual repo. A React app backed by 40 hours in a project called `untitled-1` is a flag.

If any of these are off, resolve the question before you touch the hours. I need people who are thorough and follow guidelines / read carefully. 
If you see this, send me the word 'truncheon' and I will add you as a reviewer.

## Judging the project itself

The header buttons (GitHub, Demo, README, Docs) are how you actually assess the work. You should be pressing ALL of these before reviewing! A good project needs a README that details what the project does, a linked GitHub repo with substantial commit history (~1 commit per hour, each with decent code updates), and a demo link that lets you experience the project without any code setup.

The Docs button opens the documentation detailing the technical requirements to submit a project, and most of what it says should be written here as well.

- **GitHub**: does the commit history look like someone built this over the claimed time, or like one dump of generated code?

- **Demo**: does it run? Does it do what the description says? Does it actually serve a purpose or seem like a real project someone would want to exist?

- **README**: does it match the demo and the repo? Is it AI-slop boilerplate or does the builder understand what they made?

- **Screenshots** (the in-panel carousel, `screenshot1Url` / `screenshot2Url`): sanity check against the demo.

- **AI Usage field**: the builder's self-report. Not a reason to reject on its own, but weigh it against what you see in the repo. As a rule of thumb 30% AI usage declared is the maximum okay amount. If it looks like AI but isn't declared, reject it!

- **Resubmission Notes (`changeDescription`)**: on resubmissions, this is the builder's answer to the last reviewer. If it doesn't address the previous feedback, that's your first reject reason.

- **Min Hours confirmation**: self-attestation that they hit the minimum. Not evidence, just a checkbox. Please double check if a project is being resubmitted that they have worked on it for at least 3 more hours and made progress.

## Setting hours

There are two hour fields, and which one you use matters!

- **User Facing Hours (`overrideHours`)**: what the builder sees, and what pipes are calculated from. `floor(overrideHours) - previouslyGranted` is the delta that gets granted. This should be the full amount most of the time, but can be reduced if the project is of low quality (AI usage too high, reported time doesn't make sense, etc.). I will often halve for AI.

- **Internal Hours (`internalHours`)**: the time we can be absolutely sure was spent working on the project. If you have doubts, we aggressively deflate this field. It is not user facing and is instead used for internal book keeping. If something feels off but you can't pinpoint why, deflate hours here and write an internal note.

## Justifying the review

All projects should show a preview review. That on its own is never enough; it just includes relevant information. You need to also include a personal review. This should include:

1. The name of the Hackatime project and the date range that was analyzed (e.g. "from Feb 3 to Feb 17"), along with a summary of what the data shows (e.g. "Hackatime project trivia-game analyzed from Feb 3 to Feb 17 shows 14.2 hours tracked. The heartbeat pattern is consistent with active development.").

2. A written explanation that references concrete details about the project: what was built, what makes the scope consistent with the approved hours, and what evidence the reviewer examined. For example: "The project includes a custom physics engine, multiplayer networking, and 8 hand-drawn levels. The commit history shows 47 commits over 3 weeks. 35 hours is consistent with this scope."

3. For programs that use Lapse or any other timelapse tool, the justification must also include a URL to the relevant Lapse video along with a description of what the video demonstrates. For example: "Lapse video at [URL] shows the submitter assembling their hardware project over 6 sessions. The video covers component soldering, wiring, and firmware flashing. The pace and progress are consistent with the claimed 12 hours."

## Writing the two feedback fields

These are two different audiences!

**User Feedback** (placeholder: *"Feedback to send to the user about their project..."*) goes to the builder. Write it for a teenager who just spent real time on this and is about to read your words.

- Lead with what's working. Even on a reject.
- Be specific about what needs to change. "Add a README to explain what the project is and does" beats "I can't accept this because I don't know what it is".
- If you reduce their hours, explain the reduction here too!

**Internal Note** (placeholder: *"Private note for reviewers only, not visible to the user..."*) is where to put hunches, suspicions, and useful notes to yourself or another reviewer. The note is scoped to the person not the project, so mention the relevant project.

You can also add tidbits and tags! It's always useful to have context and I'm happy for you to note down "beginner", "hardware oriented", "vibe coder", "skilled" or anything else :)

If you're tempted to put something passive-aggressive in user feedback, it probably belongs here instead.

## When to reject

- The project is AI slop (use judgement)
- The project looks like homework
- The project is submitted to another YSWS without new work
- The project was started before april 3rd and additional work not shown
- The readme doesn't detail what the project is or does
- The demo needs python installed to run
- The demo does not run
- The commit history is not distributed over a reasonable period of time
- The demo is not usable without very easy, documented set up

## When to not review

Sometimes you won't have the right OS to try the project, or you won't have the hardware experience to judge the time taken. In these cases just skip that project and leave it for someone else!

## What a bad review looks like

- Approving without opening the repo or demo.
- Rejecting with feedback like "needs more work". The builder has no idea what to do next.
- Not writing anything in the justification. This costs me money! Don't do it!
