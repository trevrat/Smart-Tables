// ==UserScript==
// @name         Smarter Tables
// @namespace    http://tampermonkey.net/
// @version      1.16
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
//Update 1.14: Rewrote entire code to fix bugs.
//Update 1.15: Fixes to pasting
//Update 1.16: Adds table column sorting

(function() {
    'use strict';

    // Add styles for selected cells
    const style = document.createElement('style');
    style.textContent = `
        .selected {
            background-color: #d1e7dd !important; /* Light green background for selection */
        }
        th.sortable:hover {
            cursor: pointer;
            background-color: #f0f0f0;
        }
    `;
    document.head.append(style);

    let selecting = false;

    // Handle cell selection
    document.addEventListener('mousedown', (e) => {
        const cell = findTableCell(e.target);
        if (cell) {
            selecting = true;
            toggleCellSelection(cell);
            e.preventDefault();
        }
    });

    document.addEventListener('mouseover', (e) => {
        if (selecting) {
            const cell = findTableCell(e.target);
            if (cell) {
                toggleCellSelection(cell);
            }
        }
    });

    document.addEventListener('mouseup', () => {
        selecting = false;
    });

    // Toggle cell selection
    function toggleCellSelection(cell) {
        cell.classList.toggle('selected');
    }

    // Find the table cell from the event target
    function findTableCell(element) {
        if (element.tagName === 'TD' || element.tagName === 'TH') {
            return element;
        } else if (element.closest('td') || element.closest('th')) {
            return element.closest('td') || element.closest('th');
        }
        return null;
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
                    row.filter(cell => cell !== undefined).join('\t') // Tab-separated values
                ).join('\n');

                // Copy to clipboard
                navigator.clipboard.writeText(clipboardText).then(() => {
                    alert('Table cells copied to clipboard!');
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

    // Make tables sortable
    function makeTablesSortable() {
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            const headers = table.querySelectorAll('th');
            headers.forEach((header, index) => {
                if (!header.classList.contains('sortable')) {
                    header.classList.add('sortable'); // Add sortable class for styling
                    let sortDirection = 'asc'; // Default sorting direction

                    // Attach a click event listener to the header to sort the column
                    header.addEventListener('click', () => {
                        sortTable(table, index, sortDirection);
                        sortDirection = (sortDirection === 'asc') ? 'desc' : 'asc'; // Toggle sorting direction
                        updateSortIndicators(header, sortDirection);
                    });
                }
            });
        });
    }

    // Update sorting indicators on the header (add/remove arrow)
    function updateSortIndicators(header, direction) {
        const allHeaders = header.parentElement.querySelectorAll('th');
        allHeaders.forEach(th => {
            th.textContent = th.textContent.replace(/▲|▼/g, ''); // Remove any existing arrows
        });
        header.textContent += direction === 'asc' ? ' ▲' : ' ▼'; // Add the appropriate arrow
    }

    // Sort a table by a specific column
    function sortTable(table, colIndex, direction) {
        const rowsArray = Array.from(table.rows).slice(1); // Exclude the header row

        rowsArray.sort((rowA, rowB) => {
            const cellA = rowA.cells[colIndex]?.textContent.trim() || '';
            const cellB = rowB.cells[colIndex]?.textContent.trim() || '';

            // Detect if the cell contains a number and sort accordingly
            const numA = parseFloat(cellA.replace(/[^0-9.-]/g, ''));
            const numB = parseFloat(cellB.replace(/[^0-9.-]/g, ''));

            if (!isNaN(numA) && !isNaN(numB)) {
                return direction === 'asc' ? numA - numB : numB - numA;
            }

            // Compare as strings for non-numeric values
            return direction === 'asc' ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        });

        // Reorder the rows in the table based on the sorted array
        rowsArray.forEach(row => table.appendChild(row));
    }

    // Observe dynamic changes to the DOM and reapply sorting functionality
    const observer = new MutationObserver(() => {
        makeTablesSortable();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Run the script when the page is fully loaded
    window.addEventListener('load', () => {
        makeTablesSortable();
    });

})();
