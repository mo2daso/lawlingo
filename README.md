# Lawlingo

A personal Law-GAT study app for laptop and mobile. Legalu the rooster helps you
learn, recall and repair mistakes. No login, Supabase or backend is required.

## Run and test

Install Node.js, then run these commands in this folder:

```sh
npm ci
npm test
```

Serve the generated `dist/` folder with any local static web server, or deploy it.
The separate desktop app in the parent LAW GAT folder still opens directly.

## Deploy on Vercel

1. Push the contents of **this folder** to your GitHub repository.
2. In Vercel, choose **Add New → Project**, then import the repository.
3. Framework: **Other**. Root directory: **./**.
4. Build command: **npm run build**. Output directory: **dist**.
5. Deploy. No environment variables are needed.

`vercel.json` already supplies the build and output settings. Vercel assigns an
available `.vercel.app` address; a particular name is not guaranteed.

## Saving and moving devices

Progress saves in the browser on the current site address. Lessons resume at
the saved question. Timed mocks continue counting through breaks.
An automatic recovery copy is kept when storage space allows.

To move desktop progress to the hosted app, use **My progress → Export**, then
**Import** on the hosted site. To move between laptop and phone, repeat this
transfer. There is no automatic cross-device sync. Export a backup after each
sitting; clearing browser data can remove both local copies.

## Features

- 604 book questions in 56 lessons, plus 200 authored foundation drills.
- Four syllabus-weighted mocks; random full and short mocks; 50 original HEC
  sample questions with practice and timed modes.
- Concise, non-duplicated memory cues, source references and source-page images.
- Missed, guessed and unanswered mock questions return for revision.
- Tap Legalu for surprises; a daily three-question golden-egg quest offers
  double XP for eligible confident recall. Immediate repeats and guesses do
  not earn double XP. Correct-answer runs and consecutive study days are shown.
- Mobile touch controls, reduced motion, optional sound and larger text.

## Sources and limits

This is a private preparation-book adaptation, not an authenticated past-paper
collection. 508 book answers have verified status; 493 also meet the explicit
syllabus scope and have distinct options, so qualify for mocks. Unverified, disputed and historical items
are labelled. Only six Islamic Jurisprudence book answers are independently
verified; that remains a material coverage gap. Read the content audits in docs/.
No predicted score or guarantee of complete syllabus mastery is made.

Official references:
- https://www.hec.gov.pk/english/services/students/etc/Documents/Curriculum-LAW-GAT-test.pdf
- https://www.hec.gov.pk/english/services/students/etc/Documents/LAW%20GAT%20Sample%20Paper.pdf

Tests use isolated storage and DOM stubs. They check logic, saving and source
integrity; they do not substitute for real mobile/browser visual inspection.

## Folder structure

```text
src/       App, styles, persistence, study rewards and syllabus selection
data/      Question banks and official sample keys/explanations
assets/    Original book-page and HEC sample-question images
tests/     Automated logic checks using synthetic progress fixtures
docs/      Content audits and generated verification reports
build.mjs  Builds the static website into dist/
```

Personal progress, backups, local HTML with a private seed, old cloud code,
node_modules and generated dist files are excluded from this repository.
The source scans are study materials, not a grant of redistribution rights.
Keep this personal study repository private if you do not intend to publish them.
