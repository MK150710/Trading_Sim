# Cpnnecting Frontend pages to Database

**Hours:** *1*

## Objective

Connected Login and Register pages to backend database through views.t

---

## What I Worked On

- Defined GET and POST conditions for login and register views
- Added a component to cleanly display any client-side errors(such as password mismatch)
- Checked for multiple edge cases such as:
    - Duplicating usernames
    - Password mismatch
    - Incorrect username or password
    - Duplicating email id

- Created a simple logout form
---

## What I Learnt

- `GET` and `POST` methods
- `Login required` decorators
- Fetching data from HTML forms
- Django USER authentication using `authenticate`
---

## Problems & Rabbit Holes

- Multiple spelling mismatches across files meant that i had to carefully check and re iterate multiple files over and over again
- Forgot my superuser username 🤪 which lead me to use shell to retireve it

---

## Functional Elements

- Fulctional Login and Register Pages tied to database
- Pop up Errors on client side
- Both frontend and backend authentication

---

## Role of AI

- AI was used as a syntax-reviewer (and in this case, a spelling checker), allowing me to focus on implementing logic in the functions
- All code is implemented and written by me

---

## Next Steps

- Research for the most suitable API key given my current website scope
- Implement its API through a HTML form to fetch JSON data
    - Parse the data and wire it up to backend
    - Create a dashboard with all the user's data
- Implement OAuth Buttons