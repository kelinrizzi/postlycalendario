# Architecture
- Gate all AI server functions with the shared approved-access middleware, so a valid session alone cannot bypass the invitation list.
- Validate generated calendars with the shared calendar schema before saving; each of the 30 days must include feed content, one story and both photo ideas.
- Administrator privileges are assigned in the protected role table, never claimed by the first signed-in visitor.