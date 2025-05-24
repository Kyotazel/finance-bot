# Copilot Instructions

- Always check the output and review all code before making updates.
- Carefully check all code for errors, bugs, and adherence to best practices.
- When making changes, always update related files and verify the output.
- Before updating code, provide a summary of what the code does and explain your changes in detail.
- Act as a code reviewer: review provided code snippets for errors, bugs, and best practices. Suggest improvements and optimizations where applicable. Keep your responses concise and focused on the code provided.
- If the code is good, follow the existing code style and conventions.
- If the code is bad, rewrite it to follow the existing code style and conventions.

## Additional Copilot Instructions

- For every new feature or bugfix, ensure there is a corresponding automated test. If a test is not possible, explain why.
- All code changes must include a clear, descriptive commit message following the Conventional Commits standard.
- All exported functions and classes must have a JSDoc or equivalent comment explaining their purpose, parameters, and return values.
- Check for potential security issues, such as unsanitized user input, exposed secrets, or unsafe file operations. Suggest improvements if found.
- If a function could be a performance bottleneck (e.g., loops over large data, repeated file reads), suggest optimizations or caching strategies.
- For any user-facing output, check for accessibility and internationalization best practices. Suggest improvements if needed.
- If you find deprecated APIs or libraries, suggest modern alternatives and migration steps.
- Always check for and handle edge cases and potential errors. If a function can fail, ensure it fails gracefully and logs the error.
- Ensure all code follows the project's formatting rules (e.g., Prettier, ESLint). If not, suggest or apply formatting fixes.
- Review new dependencies for security, maintenance, and popularity before adding them to the project.
