# Auto-Post Navigation Flow with Back Buttons

## Complete Navigation Map

```
/autopost
    ↓
┌─────────────────────────────────────┐
│     Auto-Post Manager (Main)       │
│  Status: Active/Inactive            │
│  [Configure] [Statistics] [Stop]    │
└─────────────────────────────────────┘
    ↓ Configure
┌─────────────────────────────────────┐
│   Step 1 of 4: Select Channel      │
│   [Channel Dropdown]                │
└─────────────────────────────────────┘
    ↓ Select Channel
┌─────────────────────────────────────┐
│   Step 2 of 4: Select Role         │
│   [Role Dropdown]                   │
│   [Back] [Skip]                     │ ← Back to Step 1
└─────────────────────────────────────┘
    ↓ Select Role OR Skip
┌─────────────────────────────────────┐
│   Step 3 of 4: Review & Confirm    │
│   Channel: #selected                │
│   Role: @selected or None           │
│   [Back] [Continue]                 │ ← Back to Step 2
└─────────────────────────────────────┘
    ↓ Continue
┌─────────────────────────────────────┐
│   Step 4 of 4: Final Config        │
│   [Modal: Interval & Auto-React]   │
└─────────────────────────────────────┘
    ↓ Submit
┌─────────────────────────────────────┐
│   ✓ Auto-Post Activated             │
└─────────────────────────────────────┘
```

## Back Button Locations

### 1. Step 2 (Role Selection)
**Location:** After channel selection
**Buttons:** [Back] [Skip]
**Back Action:** Returns to Step 1 (channel selection)
**Purpose:** Allow user to change channel selection

### 2. Step 3 (Review - After Role Selection)
**Location:** After selecting a role
**Buttons:** [Back] [Continue]
**Back Action:** Returns to Step 2 (role selection)
**Purpose:** Allow user to change role selection

### 3. Step 3 (Review - After Skip)
**Location:** After skipping role selection
**Buttons:** [Back] [Continue]
**Back Action:** Returns to Step 2 (role selection)
**Purpose:** Allow user to go back and select a role instead

## Navigation Scenarios

### Scenario 1: Change Channel Mid-Setup
```
Step 1: Select #memes
    ↓
Step 2: [Back] ← Click here
    ↓
Step 1: Select #funny (changed mind)
    ↓
Continue normally
```

### Scenario 2: Change Role Decision
```
Step 2: Skip role
    ↓
Step 3: Review (no role)
    ↓
[Back] ← Click here
    ↓
Step 2: Select @everyone (changed mind)
    ↓
Continue normally
```

### Scenario 3: Review Before Final Config
```
Step 2: Select @meme-lovers
    ↓
Step 3: Review
    ↓
[Back] ← Decide to change role
    ↓
Step 2: Select different role
    ↓
Step 3: Review again
    ↓
[Continue] ← Proceed when satisfied
```

## Button Styles

- **Back:** Secondary (gray) - non-destructive navigation
- **Continue:** Primary (blue) - forward progress
- **Skip:** Secondary (gray) - optional action
- **Configure/Setup:** Primary (blue) - main action
- **Statistics:** Secondary (gray) - informational
- **Stop:** Danger (red) - destructive action

## User Experience Benefits

1. **Flexibility:** Users can correct mistakes without restarting
2. **Confidence:** Review selections before final commitment
3. **Control:** Full navigation control at each step
4. **Clarity:** Clear path forward and backward
5. **Professional:** Standard navigation pattern users expect

## Technical Implementation

### Back Button Handlers
- `autopost_back_channel` - Returns to channel selection (Step 1)
- `autopost_back_role` - Returns to role selection (Step 2)

### State Management
- Setup data persists in `client.autopostSetup` Map
- Back navigation preserves previous selections
- User can navigate freely without losing data

### Error Handling
- Missing setup data shows helpful error message
- Prompts user to restart with /autopost
- Prevents crashes from invalid state

## Testing Checklist
- [ ] Back button appears on Step 2 (role selection)
- [ ] Back button appears on Step 3 (review after role)
- [ ] Back button appears on Step 3 (review after skip)
- [ ] Back from Step 2 returns to Step 1
- [ ] Back from Step 3 returns to Step 2
- [ ] Previous selections are preserved
- [ ] Can navigate back and forth multiple times
- [ ] Final submission works after navigation
- [ ] Error handling works for invalid states
