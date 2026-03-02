# Quick Fix for Auth

All pages need to add `localStorage.getItem('authToken')` to their fetch calls.

## Pages that need updating:
1. Commands.jsx - line 42 (fetchCommands)
2. Commands.jsx - line 97 (toggleCommand) 
3. Commands.jsx - line 74 (updatePrefix)
4. Overview.jsx - all fetch calls
5. Statistics.jsx - all fetch calls
6. EmbedMessages.jsx - all fetch calls
7. AutoResponder.jsx - all fetch calls

## Pattern to add:
```javascript
const token = localStorage.getItem('authToken')
const res = await fetch(`${API_URL}/api/endpoint`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

For POST requests:
```javascript
const token = localStorage.getItem('authToken')
const res = await fetch(`${API_URL}/api/endpoint`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
})
```
