# Deployment Guide for Neuromo

This guide explains how to package Neuromo for distribution or run it in a container.

## Option 1: Create a Standalone Executable (.exe) [Recommended for Windows]

This method creates a single `.exe` file that you can share or run on any Windows PC without installing Python.

### Steps:
1.  **Double-click** the `build_exe.bat` file in this folder.
2.  Wait for the process to complete (it may take a minute).
3.  Open the newly created `dist` folder.
4.  Run `Neuromo.exe`.

*Note: The first startup might be slightly slower as it unpacks necessary files.*

---

## Option 2: Docker Container

This method runs the application in an isolated container. 
**⚠️ Important:** Accessing the host camera from Docker on Windows/Mac is difficult and often requires complex configuration. This method is recommended for Linux users or advanced setups.

### Steps:

1.  **Build the Image:**
    ```bash
    docker build -t neuromo .
    ```

2.  **Run the Container:**
    *   **Linux (with camera access):**
        ```bash
        docker run --device /dev/video0 -p 8969:8969 neuromo
        ```
    *   **Windows/Mac (No Camera Access by default):**
        ```bash
        docker run -p 8969:8969 neuromo
        ```

3.  Access the app at `http://localhost:8969`.
