// ==UserScript==
// @name         Smarter Tables
// @namespace    http://tampermonkey.net/
// @version      1.14
// @description  Interact with tables like an Excel sheet, copy in tab-separated format, and manage column visibility via context menu
// @author       trevrat
// @match        *://*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/trevrat/Smart-Tables/main/Smarter%20Tables.user.js
// @downloadURL  https://raw.githubusercontent.com/trevrat/Smart-Tables/main/Smarter%20Tables.user.js
// ==/UserScript==

//Update 1.11: Added click and drag funtion to highlight multiple cells at a time.
//Update 1.12: Added Ctrl-Click fuction to click and drag multiple selections of cells at a time.
//Update 1.13: Fixed bug with text boxes not letting you type in them without holding left-click.

(function() {
    'use strict';

    // Add styles for selected cells
    const style = document.createElement('style');
    style.textContent = `
        .selected {
            background-color: #d1e7dd !important; /* Light green background for selection */
        }
    `;
    document.head.append(style);

    // Variables for cell selection
    let selecting = false;

    // Start selecting on mouse down
    document.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TD' || e.target.tagName === 'TH') {
            selecting = true;
            toggleCellSelection(e.target);
            e.preventDefault();
        }
    });

    // Continue selecting cells on mouse over
    document.addEventListener('mouseover', (e) => {
        if (selecting && (e.target.tagName === 'TD' || e.target.tagName === 'TH')) {
            toggleCellSelection(e.target);
        }
    });

    // Stop selecting on mouse up
    document.addEventListener('mouseup', () => {
        selecting = false;
    });

    // Toggle cell selection
    function toggleCellSelection(cell) {
        cell.classList.toggle('selected');
    }

    // Copy selected cells to clipboard
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            const selectedCells = document.querySelectorAll('.selected');
            if (selectedCells.length > 0) {
                const rows = {};
                selectedCells.forEach(cell => {
                    const rowIndex = cell.parentElement.rowIndex;
                    const cellIndex = cell.cellIndex;
                    if (!rows[rowIndex]) {
                        rows[rowIndex] = [];
                    }
                    rows[rowIndex][cellIndex] = cell.innerText;
                });

                // Construct the clipboard string
                const clipboardText = Object.values(rows).map(row =>
                    row.filter(cell => cell !== undefined).join('\t') // Use tab as a separator
                ).join('\n');

                // Copy to clipboard
                navigator.clipboard.writeText(clipboardText).then(() => {
                    console.log('Table cells copied to clipboard!');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            }
        }
    });

    // Clear selection when clicking outside the table
    document.addEventListener('click', (e) => {
        if (!e.target.closest('table')) {
            document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
        }
    });
})();

