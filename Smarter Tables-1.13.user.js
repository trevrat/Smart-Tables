// ==UserScript==
// @name         Smarter Tables
// @namespace    http://tampermonkey.net/
// @version      1.13
// @description  Interact with tables like an Excel sheet, copy in tab-separated format, and manage column visibility via context menu
// @author       trevrat
// @match        *://*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/trevrat/Smart-Tables/main/Smarter%20Tables-1.11.user.js
// @downloadURL  https://raw.githubusercontent.com/trevrat/Smart-Tables/main/Smarter%20Tables-1.11.user.js
// ==/UserScript==

//Update 1.11: Added click and drag funtion to highlight multiple cells at a time.
//Update 1.12: Added Ctrl-Click fuction to click and drag multiple selections of cells at a time.
//Update 1.13: Fixed bug with text boxes not letting you type in them without holding left-click.

(function() {
    'use strict';

    let isMouseDown = false;
    let lastClickedHeader = null;

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
        if (lastClickedHeader) {
            const index = Array.from(lastClickedHeader.parentNode.children).indexOf(lastClickedHeader);
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
            lastClickedHeader = e.target; // Store the last clicked header
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

        // Ignore input elements, text areas, and other interactive elements
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return; // Allow normal text box functionality
        }

        if (target.tagName === 'TD' || target.tagName === 'TH') {
            isMouseDown = true;
            target.classList.toggle('selected');
            e.preventDefault(); // Prevent text selection for table cells
        }
    });

    document.addEventListener('mouseover', function(e) {
        if (isMouseDown && (e.target.tagName === 'TD' || e.target.tagName === 'TH')) {
            e.target.classList.add('selected');
        }
    });

    document.addEventListener('mouseup', function() {
        isMouseDown = false;
        updateClipboard();
    });

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

