# AWS WAF Deobfuscator

This repository contains a Node.js AST Babel-based AWS WAF deobfuscator for the original script, crafted in about an hour for a rapid project requirement.

## Table of Contents
- [AWS WAF Deobfuscator](#aws-waf-deobfuscator)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Using the Deobfuscator](#using-the-deobfuscator)
  - [Project Structure](#project-structure)
  - [Disclaimer](#disclaimer)
  - [License](#license)
  - [My links](#my-links)

## Overview

AWS WAF's obfuscation mechanism predominantly revolves around arrays of strings. These strings are shuffled, and specific functions are designed to retrieve the right string using an index. The deobfuscation task involves deciphering these strings accurately.

## Features

- **Array-based Obfuscation**: The core obfuscation is mostly reliant on arrays of strings. The strings in these arrays are shuffled, and a function is used to obtain the correct string based on a specified index.
- **Nested Function Calls**: A primary function or array is responsible for the deobfuscation of most strings. However, scattered throughout the code are "child" functions that follow similar logic. One challenge was that some of these functions depended on one or two other functions to deobfuscate their respective arrays.
- **Dynamic Function Naming**: The obfuscated functions are associated with variable names that change, making it challenging to identify them directly. This tool uses AST traversal to map and handle these dynamically named functions efficiently.
- **Final Array Replacement**: After the major deobfuscation steps, some straightforward arrays of strings remain. For these, a simple replacement mechanism is employed where any reference like `list[x]` is replaced with its actual value from the array.

## Using the Deobfuscator

1. **Prerequisites**:
   - Ensure you have Node.js installed.
   - Familiarize yourself with Babel, especially if you wish to make modifications or extend the tool's functionality.

2. **Installation**:
   - Clone the repository.
   - Navigate to the project directory and run `npm install` to install necessary dependencies.

3. **Running the Deobfuscator**:
   - Use the command: `node main.js <path_to_input_script> <path_to_output_script>`.
     - `<path_to_input_script>` is the path to the AWS WAF obfuscated script you want to deobfuscate.
     - `<path_to_output_script>` is the path where you want the deobfuscated script to be saved.

## Project Structure

The project is modularized into different transformers, each handling specific deobfuscation tasks:

- `firstObfuscatorFinder.js`: Identifies and handles the primary deobfuscation function.
- `iifeFinder.js`: Finds and processes Immediately Invoked Function Expressions (IIFE) which are a part of the obfuscation.
- `callsReplacer.js`: Handles the task of replacing obfuscated function calls with their deobfuscated values.

The main driver script, `main.js`, coordinates these transformers to process an obfuscated script from start to finish.

## Disclaimer

This tool was built quickly to cater to an immediate need. Consequently, the naming conventions and overall code structure might not adhere to best practices. However, the code comments and this documentation should assist you in understanding its workings. If you're planning to use this tool for serious or regular work, consider refactoring the code and enhancing its robustness.

## License

This project is licensed under the MIT License. Refer to the `LICENSE` file for more information.

## My links

- [Website](https://glizzykingdreko.github.io/)
- [GitHub](https://github.com/glizzykingdreko)
- [Twitter](https://mobile.twitter.com/glizzykingdreko)
- [Medium](https://medium.com/@glizzykingdreko)
- [Email](mailto:glizzykingdreko@protonmail.com)
