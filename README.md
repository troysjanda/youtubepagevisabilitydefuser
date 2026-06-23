# Youtube.com Page Visibility Defuser Userscript.

Userscript to prevent Youtube from detecting if tab is not in focus.

# What it does — four layers of spoofing:

* Page Visibility API — overrides document.hidden (always false) and document.visibilityState (always "visible"), and blocks visibilitychange events before YouTube's handlers ever see them.
* Window focus/blur — drops blur and pagehide event registrations from YouTube and intercepts any that slip through at the capture phase.
* document.hasFocus() — always returns true, so focus-polling code also stays fooled.
* IntersectionObserver — wraps the constructor to proxy all observed entries with intersectionRatio: 1 and isIntersecting: true, which prevents the player from auto-pausing when it scrolls off screen.
