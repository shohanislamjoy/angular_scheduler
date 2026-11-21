# ROUTEQUOTE

## SETUP
1. Install Node.js and npm.
2. Open a terminal in this project folder.
3. Install the packages with:
   npm ci

## RUN
Start the development server with:
   npm start

## Open:
   http://localhost:4200/

## Build a production version with:
   npm run build



### MY MAIN TECHNICAL DECISIONS
I used an Angular standalone component for the main page because it keeps the
screen and page logic together in an easy-to-understand place. The form fields
are controlled by Angular reactive forms, so I can check the values in one
place instead of checking them separately everywhere.

When the user asks for a quote, I validate the trip first. Then I show a loading
state and calculate the result after 300 milliseconds. The short timer just
makes the app feel like it is waiting for a quote without needing a fake server.

I use browser localStorage to save drafts. Before loading a draft, I clean the
saved data and replace bad values with safe empty values. This helps prevent a
damaged draft from breaking the form.

For drop-off positions, I use the browser's native drag and drop feature. This
means I did not need to install another drag-and-drop package.

I also create a trip key from all the trip fields. The page compares this key
with the key used for the quote. If the user changes the trip, the old quote
is hidden until a new quote is calculated.

I made quote generation wait for 300 milliseconds so the loading state is
visible. If the user asks for another valid quote before the old one finishes,
I cancel the old timer. This stops an older result from replacing the newest
result. The service tracks pending, success, invalid, and idle states.

The app calculates everything locally, so I use one fixed 300 millisecond
timer instead of variable server-style response times. There is no need to
simulate delays from 300 to 1,200 milliseconds because there is no network
request or server response in this project.

### MY SIGNIFICANT ISSUES AND WHAT I DID
I found the distance calculation a little different and on the file you
mentioned that there is no return leg to the pickup location. So we cannot go
to the same location twice. I checked that and kept it that way. The location
pattern in the distance data was only written as A-B, B-C, and similar pairs.
But if the pickup is E and the drop-off is A, we should still provide the
service. I sorted the two location names, so E and A become A-E, and the same
distance can be used.

I also found that the fake timer and quote calculation code was commented out
at first. I restored it as a real asynchronous request with cancellation
instead of keeping the quote calculation stuck or direct.

### HOW I VERIFIED THAT THE PROJECT WORKS
I ran it properly and checked whether the draft save, restore, and clear
functions work. I also matched a calculation example from the project and it
matched the result from the app. I did some manual testing for the other parts
too. I ran npm run build and it passed.

### AI TOOLS DISCLOSURE
GitHub Copilot was used to help finish some lines and suggest fixes for syntax
errors. At the start, it also helped generate the Angular project template.
For the final implementation, I independently reviewed the quote calculation,
draft behavior, distance rules, and UI states. I tested the app manually and
checked the build with ordinary Angular and Node.js commands.
