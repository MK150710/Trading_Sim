# Day 1 & 2 – Creating the Landing Page

**Hours:** *3.4*

## Objective

My goal for this session was to create a stunning and functional Landing page for TradeSims, while learning about html and django

---

## What I Worked On

Instead of keeping everything inside one large `index.html` file, I decided to split the landing page into reusable Django components. This took some extra time initially but will make future development significantly easier.

I created separate components for:

- Hero
- Markets
- Features
- About
- Statistics
- FAQ
- Contact
- Navbar
- Footer

These are all assembled inside `index.html`, while every page extends a common `layout.html` template.

I also organised the project using Django's recommended structure by separating templates, static files, CSS, JavaScript, and reusable components.

---

## Learning Django Templates

This was my first time using Django templates.

During these sessions I learnt how to use:

- `{% extends %}` for template inheritance
- `{% include %}` for reusable components
- `{% load static %}` for serving CSS and JavaScript
- `{% url %}` for URL routing
- Views and URL configuration
- Django's static file structure

---

## Styling

I designed and wrote the HTML structure myself.

For the CSS, I used Claude to generate the initial stylesheet from my HTML components. Rather than spending several hours manually writing hundreds of lines of CSS, I focused on understanding how the generated CSS connected to my HTML and how to integrate it correctly into Django.

This let me spend more time learning Django's architecture while still ending up with a polished landing page.

---

## Problems & Rabbit Holes


Some of the issues I encountered included:

- `NoReverseMatch` errors dur to referencing an incorrect url name
- Issues with including bootstrap CSS, which caused the FAQ section to fail
- Understanding the detailed CSS code written by claude that made my page so beauticul
- Breaking one massive file into components to indivisually work on and debug each of them seperately

Although these problems slowed me down, each one helped me understand Django's workflow much better.

---

## Progress

By the end of these sessions I had:

- Built the complete homepage structure.
- Converted the landing page into small, iterable Django components.
- Created a reusable `layout.html`.
- Connected Django views, URLs, templates and static files.
- Successfully rendered the landing page through Django.

---

## Next Steps

- Complete the remaining frontend pages.
- Implement Django authentication (Login/Register).
- Build the trading dashboard.
- Connect live stock market APIs.
- Begin implementing the paper trading backend.
