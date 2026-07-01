# Day 3 & 4 - Creating login and register pages

**Hours:** *3*

## Objective

Create and render the frontend part of login and register pages for website

---

## What I Worked On

Writing HTML code and creating a form to input the First Name, last name, user ID, email ID, and password.

After initial creation of HTML pages, it was broken into functional components to make code more readable structured
---


## Styling

The HTML forms and components were created by me, with specific styling desicions inspired by Claude.

The Specific CSS and JavaScript used to stylise the webpage, and to check for password strength, and email validity was implimented by claude.

All AI generated code was cross checked and modified by me to fit the project's coding style
---

## Problems & Rabbit Holes


Some of the issues I encountered included:

- Overflowing of the right panel of both login and register pages, which was fixed by changing bootsteap property of the container to a `fluid` state.

- Error thrown when page was rendered due to mismatch between component naming and file structure(particularly not mentioning the compoenents folder)

- Various changes in url reference links as most of them were pointing towards homepage during initial development

Through various iterations i was thankfully able to successfully render the entire webpage
---

## Functional Elements

- Working login page
- Working register page
- All redirect links and buttons for login and register functional.
- Password strength check at client side
- (Frontend only) Google and GitHub OAuth buttons 
- Panels for both login and register pages to make the page visually appealing

## Next Steps

- Implement Django database models and SQL queries to be able to save user information
- Make OAuth Buttons functional
- Create Dashboard for user to view their paper currency value, stock holding, portfolio value, etc
- Add API to be able to pull live data of stocks 