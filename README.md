# C / TXT Header Exporter

It lets you add a formatted student/program header to `.c` and `.txt` files directly in the browser.

No installation, server, or backend is required.

## Features

* Manual entry for name, roll number, and class
* People database stored in the browser
* Add, update, delete, search, sort, and select people records
* Import and export the people database as `people.json`
* Select multiple `.c` or `.txt` source files
* Remove individual selected files or clear all selected files
* Export as `.txt` or `.c`
* Optional name suffix in output filenames
* Header format options:

  * C comment block
  * Plain text
* Downloads generated files as `header_export.zip`

## How to Use

1. Open the website: https://aswins404.github.io/CorTXT_HeaderAdder/
2. Choose **Manual Entry** or **Use People Database**.
3. Enter or select the person details.
4. Select one or more `.c` or `.txt` source files.
5. Choose the export type and header format.
6. Click **Export Files**.
7. Extract `header_export.zip` to get the generated files.

## People Database

The people database is saved in the browser on the same computer using local storage.

Use **Export Database** to download a backup as `people.json`.

Use **Import Database** to restore or move the database to another browser or computer.

## Privacy

All processing happens locally in your browser. No files, personal information, or database records are uploaded to any server.

## Credits

Built with HTML, CSS, and JavaScript.

Developed with assistance from **ChatGPT by** [OpenAI](https://openai.com?utm_source=chatgpt.com).
