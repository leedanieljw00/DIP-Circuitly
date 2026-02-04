# Circuitly

An interactive quiz application for Electrical Engineering students, focusing on circuit analysis, theorems, and three-phase power systems.

## 🚀 How to Run

Because this application loads data from external files (CSV, SVG), it **cannot** be run just by opening the `index.html` file in a browser due to security restrictions (CORS).

**You must use a Local Web Server.**

### Recommended Method (VS Code)
1.  Install [Visual Studio Code](https://code.visualstudio.com/).
2.  Install the **"Live Server"** extension by Ritwick Dey.
3.  Open this project folder in VS Code.
4.  Right-click `index.html` and select **"Open with Live Server"**.

## 📂 Project Structure

-   `index.html`: Main entry point.
-   `questions/`:
    -   `QuestionBank.csv`: Source of truth for all static questions.
-   `js/`: Application logic.
    -   `app.js`: Main controller.
    -   `services/`: Data handling and unique question generation.
        -   `DataService.js`: Loads CSV and manages question fetching.
        -   `ThreePhaseCircuitGenerator.js`: Generates dynamic circuit diagrams.
    -   `components/`: UI components.
        -   `Home.js`: Menu and topic selection.
        -   `Quiz.js`: Quiz interface, adaptive logic, and review screen.

## 🌟 Features

-   **Dynamic Questions**: Generates infinite unique circuit problems for Topic 8.
-   **Adaptive Difficulty**: Switches between Theory and Circuit modes based on user performance.
-   **Review System**: Detailed breakdown of incorrect answers at the end of each session.
