# intranet.bookshelf.nodejs

#### The backend part of the Bookshelf project.

This project is a **(M)ongoDB (E)xpress (R)eact (N)ode.js** stack with React being the front-end. 

*Refer to intranet.bookshelf.react*.

## Technologies Used

+ **Node.js**: The main backend for the project. Mostly everything in this project is build using JavaScript.

+ **Express.js**: The REST API handler. This will allow REST requests coming from the front-end to communicate with the back-end (here).

+ **Mongoose**: A library to easily communicate with the MongoDB database.

+ **Mocha**: A test runner to perform assertion tests.

+ **Chai**: A test library, in-junction with Mocha, that will perform the tests.
  - *Chai-HTTP*: Chai Plugin that will help with performing HTTP requests with *Express*.
  - *Chai-String*: Chain Plugin that will perform string tests like sub-string finding.

+ **PDF.js**: A JavaScript library to help work with the PDF files like retrieving the first page to act as the cover of an eBook entry.

## How does it work?

It all starts with a creation of a `Shelf` object. This will act as a collection of eBook files and directories at a location in a server. When first created, it will be given a name, and an absolute path from the server. This absolute path will be used for the files and folders.

Once a `Shelf` is created; it will attempt to check if there are `Files` and `Folders` already inside of the `Shelfs'` root directory. If there are none found already in the `File` and `Folder` `collections` (MongoDB) then it will perform a JavaScript action to loop through all files and directories in that root path. For each file and folder found; it will create the respective `File` and `Folder` objects. 

After the loop is completed, it will return the results to the front-end.

## Coming Soon

+ User Login: Allow a user to make their own `Shelves` and flag the `Files` as read. Furthermore, the users will be stored outside of the MongoDB database, and it will be in its own user database.

+ File Upload: Allow a user to upload a file (and folders) to the server. They will only upload inside the `Shelf` directory if inside a collection.