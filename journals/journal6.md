# Fixing Dashboard rendering
**Hours:** *0.5*

## Objective

Fix issue with dashboard Transaction section rendering
---

# Bug 

```
dashboard.js:513 Uncaught ReferenceError: renderTransactions is not defined
    at HTMLDocument.<anonymous> (dashboard.js:513:3)
```

## What I Worked On

- Tried to find issue in code
    - I got really confused cause the function was well defined
- Tried to rewrite codeblock, but this approach failed
- Finally, with the help of AI, used The console to finally find the issue, which was a caching issue
    - During the routine cleanup of code by me last night, I acciently removed the ending (`*/`) of a JS comment before the render transaction function, causing it to not be rendered

---

## What I Learnt

- What a `ReferenceError` is, it indicates that a function was not defined or parsed
- How to use the console and its cached code to validate server-side code issues
- Network cache, how it works and how to fix issues 
- Hard refreshing browser, using Ctrl+Shift+R
---

## Important

I have given this issue 30 mins which were not tracked in hacktime becuase most of the work here was in the terminal and in console of browser, both of which are not considered for tracking by HackTime

---

## Role of AI

- AI was used to help find the error
- It helped me learn how to use the console and guided me through finding the errors

---

## Next Steps

- Finalise dashboard
- Conenct stock API and change fake data to real one