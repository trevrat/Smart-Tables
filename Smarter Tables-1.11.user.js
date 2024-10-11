// ==UserScript==
// @name         Smarter Tables
// @namespace    http://tampermonkey.net/
// @version      1.11
// @description  Interact with tables like an Excel sheet, copy in tab-separated format, manage column visibility via context menu, and select cells with rectangular selection
// @author       trevrat
// @match        *://*/*
// @grant        none
// ==/UserScript==

// Update 1.11: When you click and hold the mouse, then drag diagonally, it will select all cells within the rectangular area formed by your drag.
(function() {
    'use strict';

    let isMouseDown = false;
    let startCell = null;

    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'absolute';
    contextMenu.style.zIndex = '1000';
    contextMenu.style.backgroundColor = 'white';
    contextMenu.style.border = '1px solid black';
    contextMenu.style.padding = '5px';
    contextMenu.style.display = 'none'; // Initially hidden
    document.body.appendChild(contextMenu);

    // Option to hide column
    const hideOption = document.createElement('div');
    hideOption.textContent = 'Hide Column';
    hideOption.style.cursor = 'pointer';
    hideOption.addEventListener('click', () => {
        if (startCell) {
            const index = Array.from(startCell.parentNode.children).indexOf(startCell);
            const cells = document.querySelectorAll(`td:nth-child(${index + 1}), th:nth-child(${index + 1})`);
            cells.forEach(cell => {
                cell.style.display = 'none'; // Hide the column
            });
        }
        contextMenu.style.display = 'none'; // Hide context menu
    });
    contextMenu.appendChild(hideOption);

    // Option to show all hidden columns
    const showAllOption = document.createElement('div');
    showAllOption.textContent = 'Show All Columns';
    showAllOption.style.cursor = 'pointer';
    showAllOption.addEventListener('click', () => {
        const allCells = document.querySelectorAll('td, th');
        allCells.forEach(cell => {
            cell.style.display = ''; // Show all columns
        });
        contextMenu.style.display = 'none'; // Hide context menu
    });
    contextMenu.appendChild(showAllOption);

    // Show the context menu on right-click
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'TH') {
            e.preventDefault(); // Prevent default context menu
            startCell = e.target; // Store the last clicked header
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.style.display = 'block'; // Show the custom context menu
        } else {
            contextMenu.style.display = 'none'; // Hide if right-clicked elsewhere
        }
    });

    // Hide the context menu on click anywhere else
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    // Add event listeners for mouse events
    document.addEventListener('mousedown', function(e) {
        const target = e.target;

        if (target.tagName === 'TD' || target.tagName === 'TH') {
            isMouseDown = true;
            startCell = target;
            toggleCellSelection(target);
            e.preventDefault(); // Prevent text selection
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (isMouseDown) {
            const target = e.target;
            if (target.tagName === 'TD' || target.tagName === 'TH') {
                // Get the starting and current cell coordinates
                const startCellCoords = startCell.getBoundingClientRect();
                const targetCellCoords = target.getBoundingClientRect();

                const minX = Math.min(startCellCoords.left, targetCellCoords.left);
                const maxX = Math.max(startCellCoords.right, targetCellCoords.right);
                const minY = Math.min(startCellCoords.top, targetCellCoords.top);
                const maxY = Math.max(startCellCoords.bottom, targetCellCoords.bottom);

                // Deselect all cells first
                deselectAllCells();

                // Select cells within the rectangular area
                const allCells = document.querySelectorAll('td, th');
                allCells.forEach(cell => {
                    const cellCoords = cell.getBoundingClientRect();
                    if (
                        cellCoords.left >= minX &&
                        cellCoords.right <= maxX &&
                        cellCoords.top >= minY &&
                        cellCoords.bottom <= maxY
                    ) {
                        toggleCellSelection(cell);
                    }
                });
            }
        }
    });

    document.addEventListener('mouseup', function() {
        isMouseDown = false;
        updateClipboard();
    });

    function toggleCellSelection(cell) {
        cell.classList.toggle('selected');
    }

    function deselectAllCells() {
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
