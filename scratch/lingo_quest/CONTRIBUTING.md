# Contributing to Circuitly

We welcome contributions! Whether you're adding questions or improving the code, here's how to help.

## 📝 Adding Questions

The Question Bank is stored in a simple CSV file. You don't need to be a coder to add questions!

1.  Open `questions/QuestionBank.csv`.
2.  Add a new line at the bottom.
3.  Follow this format:
    `id,topicId,question,optionA,optionB,optionC,answer,explanation`
    
    *   **id**: Unique number (e.g., 901).
    *   **topicId**: 
        *   1: Fundamentals
        *   2: Energy Storage
        *   3: Transient & Steady-State
        *   4: Ideal Op-Amps
        *   5: Laplace Transforms
        *   6: Network Functions
        *   7: DC vs. AC
        *   8: Three-Phase Circuits
    *   **question**: The question text. Wrap in "double quotes" if it contains commas.
    *   **answer**: Must EXACTLY match one of the options.
    *   **explanation**: Brief explanation of the correct answer.

## 💻 Code Contributions

This project uses **Vanilla JavaScript**. No build tools, no React/Vue/Angular.

### Standards
-   **JavaScript**: Modern ES6+ (arrow functions, `const`/`let`, `async`/`await`).
-   **CSS**: Standard CSS in `css/style.css` or inline styles for dynamic components.
-   **No Dependencies**: Avoid adding external libraries unless absolutely necessary.

### Project Layout
-   `js/components/`: UI-only code (rendering HTML elements).
-   `js/services/`: Business logic, data fetching, and calculation engines.

## 🔄 Workflow

1.  **Fork** the repository (if using GitHub).
2.  Create a **Branch** for your feature or content update.
3.  Test your changes using **Live Server**.
4.  Submit a **Pull Request**.

---
*Thank you for helping students master circuits!*
