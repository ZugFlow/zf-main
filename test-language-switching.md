# Language Switching Test

## Test Steps

1. **Navigate to Login Page**
   - Go to `/login`
   - Verify the page loads in Italian by default (or browser language)

2. **Test Language Switcher**
   - Look for the language switcher button in the top-right corner
   - Click the button to switch from Italian to English
   - Verify all text changes to English:
     - "Accedi" → "Sign In"
     - "Accedi al tuo account per continuare" → "Sign in to your account to continue"
     - "Credenziali" → "Credentials"
     - "Email" → "Email"
     - "Password" → "Password"
     - "Accedi con Google" → "Sign in with Google"
     - "Non hai ancora un account?" → "Don't have an account yet?"
     - "Registrati" → "Sign Up"

3. **Test Register Page**
   - Click on "Sign Up" link
   - Verify the register page also loads in English
   - Test switching back to Italian
   - Verify all text changes back to Italian

4. **Test Persistence**
   - Refresh the page
   - Verify the language preference is maintained
   - Close and reopen the browser
   - Verify the language preference is still saved

5. **Test Error Messages**
   - Try to submit the form with invalid data
   - Verify error messages appear in the correct language
   - Switch language and verify error messages update

## Expected Behavior

- Language switcher should be visible in top-right corner
- Switching should be instant and smooth
- All text should be properly translated
- Language preference should persist across sessions
- Error messages should be in the correct language
- Form placeholders should update with language change

## Notes

- The system defaults to Italian if no language preference is saved
- Browser language detection is used as fallback
- All translations are stored in the LanguageContext
- The language switcher uses a clean, modern design with hover effects
