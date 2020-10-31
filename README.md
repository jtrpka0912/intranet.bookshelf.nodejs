# intranet.bookshelf.nodejs

#### The backend part of the Bookshelf project.

This project is a **(M)ongoDB (E)xpress (R)eact (N)ode.js** stack with React being the front-end. 

*Refer to intranet.bookshelf.react*.

## Technologies Used

#### Backend

+ **Node.js**: The main backend for the project. Mostly everything in this project is build using JavaScript.

+ **DotEnv**: Allows the use of environment variables for the backend application.  
  `npm install dotenv`

+ **Express.js**: The REST API handler. This will allow REST requests coming from the front-end to communicate with the back-end (here).  
  `npm install express`

+ **CORS**: Helps with Express, or other similiar packages, to make REQUEST calls to abide with CORS.  
  `npm install cors`

#### Database

+ **Mongoose**: A library to easily communicate with the MongoDB database.  
  `npm install mongoose`

#### Testing

+ **Mocha**: A test runner to perform assertion tests.  
  `npm install mocha`

+ **Chai**: A test library, in-junction with Mocha, that will perform the tests.  
  `npm install chai`
  - *Chai-HTTP*: Chai Plugin that will help with performing HTTP requests with *Express*.  
    `npm install chai-http`
  - *Chai-String*: Chain Plugin that will perform string tests like sub-string finding.  
    `npm install chai-string`

+ **Mongo Memory Server**: An in-memory MongoDB database solely for the purpose of testing the database.  
  `npm install mongodb-memory-server`

#### Other

+ **PDF.js**: A JavaScript library to help work with the PDF files like retrieving the first page to act as the cover of an eBook entry.  
  `npm install pdfjs-dist`
+ **Canvas**: Replicates the <canvas> HTML tag, and exclusively used with *PDF.js*.
  `npm install canvas`

## Directory Structure

+ **libs** - Collection of functions to work with the *Node.js* app
  + **helpers** - Shortcut functions that can help reduce code around the app
    + **mocha** - Helper functions for *Mocha* tests
      + **express** - Helper functions for the express tests
        + *assert.js* - Assert Style Tests
  + **shelf** - Functions to retrieve folders and files
    + *mongodb.js* - Functions to retrieve folders and files from *MongoDB*
    + *server.js* - Functions to retrieve folders and files from the server
+ **models** - All of the *Mongoose* schemas
+ **node_modules** - All of the NPM dependency packages
+ **public** - All of the public assets (images, etc...) are stored
  + **images** - Storage of all images to be used
    + **covers** - All of the eBook cover images are stored here based on their location path
+ **routes** - All of the *express.js* routers are stored
+ **test** - *Mocha* test files (it mirrors the *Node.js* directory structure)


## How does it work?

It all starts with a creation of a `Shelf` object. This will act as a collection of eBook files and directories at a location in a server. When first created, it will be given a name, and an absolute path from the server. This absolute path will be used for the files and folders.

Once a `Shelf` is created; it will attempt to check if there are `Files` and `Folders` already inside of the `Shelfs'` root directory. If there are none found already in the `File` and `Folder` `collections` (MongoDB) then it will perform a JavaScript action to loop through all files and directories in that root path. For each file and folder found; it will create the respective `File` and `Folder` objects. 

After the loop is completed, it will return the results to the front-end.

## Coming Soon

+ User Login: Allow a user to make their own `Shelves` and flag the `Files` as read. Furthermore, the users will be stored outside of the MongoDB database, and it will be in its own user database.