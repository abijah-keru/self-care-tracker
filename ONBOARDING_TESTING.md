# Onboarding Flow Testing Guide

## Overview
The onboarding system includes two flows:

### Initial Onboarding
Asks users "What do you need most right now?" with two options:
1. **Find my balance** - Routes to Daily Anchors section
2. **Start shaping my dream life** - Routes to Dreams section

### Weekly Path Reflection
Asks users "What do you need most this week?" weekly with the same options, plus a "Don't ask again" checkbox for both flows.

## Testing the Onboarding Flow

### Prerequisites
- Open the app in a browser
- Open Developer Console (F12) to see debug logs

### Test Scenarios

#### 1. New User (First Time)
- Clear browser localStorage: `localStorage.clear()`
- Refresh the page
- The onboarding should appear automatically
- Select either option to test routing

#### 2. Returning User (Onboarding Completed)
- Complete the onboarding once
- Refresh the page
- Onboarding should NOT appear
- User should go directly to the main app

#### 3. User with Existing Data
- Add some data to the app (check anchors, etc.)
- Clear onboarding flags: `localStorage.removeItem('new_user_onboarding_shown')`
- Refresh the page
- Onboarding should NOT appear (user has existing data)

#### 4. Weekly Path Reflection
- Complete initial onboarding
- Wait 7 days or manually trigger: `triggerWeeklyReflectionForTesting()`
- Weekly reflection should appear with "What do you need most this week?"
- Test "Don't ask again" checkbox functionality

### Manual Testing Commands

#### Force Onboarding Display
```javascript
// In browser console
triggerOnboardingForTesting()
```

#### Force Weekly Reflection Display
```javascript
// In browser console
triggerWeeklyReflectionForTesting()
```

#### Check Onboarding Status
```javascript
// In browser console
console.log({
  onboardingShown: localStorage.getItem('new_user_onboarding_shown'),
  userPreference: localStorage.getItem('user_onboarding_preference'),
  anchorsWelcomeShown: localStorage.getItem('daily-anchors_welcome_shown'),
  dreamsWelcomeShown: localStorage.getItem('dream-life_welcome_shown'),
  weeklyPreference: localStorage.getItem('weekly_path_preference'),
  lastWeeklyDate: localStorage.getItem('weekly_reflection_date'),
  neverAskOnboarding: localStorage.getItem('never_ask_onboarding'),
  neverAskWeekly: localStorage.getItem('never_ask_weekly')
})
```

#### Reset Onboarding State
```javascript
// In browser console
localStorage.removeItem('new_user_onboarding_shown')
localStorage.removeItem('user_onboarding_preference')
localStorage.removeItem('daily-anchors_welcome_shown')
localStorage.removeItem('dream-life_welcome_shown')
localStorage.removeItem('weekly_path_preference')
localStorage.removeItem('weekly_reflection_date')
localStorage.removeItem('never_ask_onboarding')
localStorage.removeItem('never_ask_weekly')
location.reload()
```

### Expected Behavior

1. **Initial Onboarding**: Modal overlay with two large, clickable options and "Don't ask again" checkbox
2. **Weekly Reflection**: Same options appear weekly with "Don't ask again" checkbox
3. **Option Selection**: Clicking an option routes to the corresponding section
4. **Welcome Messages**: First-time visitors see welcome messages in each section
5. **Persistence**: User preference and completion status are stored
6. **Skip Logic**: Onboarding only shows for truly new users
7. **Weekly Timing**: Weekly reflection appears every 7 days unless opted out
8. **Opt-out Options**: Users can choose to never see onboarding or weekly reflections again

### Debug Information
Check the console for these log messages:
- "Setting up new user onboarding flow..."
- "User selected: [option]"
- "New user onboarding completed. Preference: [preference], Don't ask again: [boolean]"
- "Successfully navigated to [section] section"
- "Showing welcome message for [section]"
- "Setting up weekly path reflection..."
- "User selected weekly: [option]"
- "Weekly reflection completed. Preference: [preference], Don't ask again: [boolean]"
- "Days since last weekly reflection: [number]"
- "Weekly path reflection displayed"

### Known Issues
- None currently identified
- All functionality has been implemented according to specifications

## Implementation Details

### Files Modified
- `index.html` - Added onboarding HTML structure
- `style.css` - Added onboarding and welcome message styles
- `script.js` - Added onboarding logic and navigation functions

### Key Functions
- `setupNewUserOnboarding()` - Sets up event listeners for initial onboarding
- `completeNewUserOnboarding(preference, dontAskAgain)` - Handles initial onboarding completion
- `setupWeeklyPathReflection()` - Sets up event listeners for weekly reflection
- `completeWeeklyReflection(preference, dontAskAgain)` - Handles weekly reflection completion
- `shouldShowWeeklyReflection()` - Determines if weekly reflection should be shown
- `showWeeklyReflectionIfNeeded()` - Shows weekly reflection if conditions are met
- `navigateToSection(sectionName)` - Routes to selected section
- `showWelcomeMessageIfNeeded(sectionName)` - Shows welcome messages
- `dismissWelcomeMessage(sectionName)` - Hides welcome messages

### Local Storage Keys
- `new_user_onboarding_shown` - Whether initial onboarding was completed
- `user_onboarding_preference` - User's selected option from initial onboarding
- `weekly_path_preference` - User's selected option from weekly reflection
- `weekly_reflection_date` - Timestamp of last weekly reflection
- `never_ask_onboarding` - User opted out of initial onboarding
- `never_ask_weekly` - User opted out of weekly reflections
- `[section]_welcome_shown` - Whether welcome message was shown for each section
