# Data honesty rules
1. Only provider adapters create data; the service layer is the only place deciding live vs demo.
2. Offline or failing providers produce UNAVAILABLE or DEMO states, never silent substitutes.
3. Demo data is labelled DEMO everywhere it appears, including exports and alerts (demo/sample events never trigger alerts).
4. Estimates and projections are labelled and explain their method.
5. Automatic classifications (category, severity, country) are labelled as automatic.
6. Preprints are labelled as not peer reviewed; satellite elements are not positions; ADS-B coverage is partial.
