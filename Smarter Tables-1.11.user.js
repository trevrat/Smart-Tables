// ==UserScript==
// @name         Smarter Tables
// @namespace    http://tampermonkey.net/
// @version      1.12
// @description  Interact with tables like an Excel sheet, copy in tab-separated format, and manage column visibility via context menu
// @author       trevrat
// @match        *://*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/trevrat/Smart-Tables/main/Smarter%20Tables-1.11.user.js

// @downloadURL  https://raw.githubusercontent.com/trevrat/Smart-Tables/main/Smarter%20Tables-1.11.user.js

// ==/UserScript==

//Update 1.11: Added click and drag funtion to highlight multiple cells at a time.
//Update 1.12: Added Ctrl-Click fuction to click and drag multiple selections of cells at a time.

(function() {
    'use strict';

    let isMouseDown = false;
    let startCell = null;

    // Add event listeners for mouse events
    document.addEventListener('mousedown', function(e) {
        const target = e.target;

        if ((target.tagName === 'TD' || target.tagName === 'TH') && e.button === 0) {
            isMouseDown = true;
            startCell = target;

            if (!e.ctrlKey) {
                clearSelection(); // Only clear selection if Ctrl is not held down
            }

            target.classList.toggle('selected'); // Toggle selection for the clicked cell
            e.preventDefault(); // Prevent text selection
        }
    });

    document.addEventListener('mouseover', function(e) {
        if (isMouseDown && (e.target.tagName === 'TD' || e.target.tagName === 'TH')) {
            let endCell = e.target;
            selectRectangle(startCell, endCell); // Select the rectangle formed by start and end cells
        }
    });

    document.addEventListener('mouseup', function() {
        isMouseDown = false;
        startCell = null;
        updateClipboard();
    });

    function selectRectangle(startCell, endCell) {
        let startRow = startCell.parentElement.rowIndex;
        let startCol = startCell.cellIndex;
        let endRow = endCell.parentElement.rowIndex;
        let endCol = endCell.cellIndex;

        let rowStart = Math.min(startRow, endRow);
        let rowEnd = Math.max(startRow, endRow);
        let colStart = Math.min(startCol, endCol);
        let colEnd = Math.max(startCol, endCol);

        for (let row = rowStart; row <= rowEnd; row++) {
            let rowCells = startCell.parentElement.parentElement.rows[row].cells;
            for (let col = colStart; col <= colEnd; col++) {
                rowCells[col].classList.add('selected');
            }
        }
    }

    function clearSelection() {
        const selectedCells = document.querySelectorAll('td.selected, th.selected');
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
        });
    }

    function updateClipboard() {
        const selectedCells = document.querySelectorAll('td.selected, th.selected');

        // Create a tab-separated string from selected cells
        let result = '';
        let currentRow = [];
        let currentRowIndex = -1;

        selectedCells.forEach((cell) => {
            const row = cell.parentElement;
            const rowIndex = Array.from(row.parentElement.children).indexOf(row);

            // If it's the first cell of a new row, add the current row to the result and start a new row
            if (currentRowIndex !== rowIndex) {
                if (currentRow.length > 0) {
                    result += currentRow.join('\t') + '\n'; // Join columns with a tab
                }
                currentRow = []; // Reset the current row
                currentRowIndex = rowIndex; // Update the current row index
            }

            // Add the cell text to the current row
            currentRow.push(cell.innerText.trim());
        });

        // Add the last row if it exists
        if (currentRow.length > 0) {
            result += currentRow.join('\t'); // Join columns with a tab for the last row
        }

        // Create a temporary textarea for copying the tab-separated data
        const textarea = document.createElement('textarea');
        textarea.value = result.trim(); // Trim any trailing newlines
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Add some CSS for selected cells
    const style = document.createElement('style');
    style.textContent = `
        td.selected, th.selected {
            background-color: #cce5ff !important;
        }
    `;
    document.head.appendChild(style);
})();
