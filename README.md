# intranet.bookshelf.nodejs

#### The backend part of the Bookshelf project.

This project is a **(M)ongoDB (E)xpress (R)eact (N)ode.js** stack with React being the front-end. 

*Refer to intranet.bookshelf.react*.

### Technologies Used

+ **Node.js**: The main backend for the project. Mostly everything in this project is build using JavaScript.

+ **Express.js**: The REST API handler. This will allow REST requests coming from the front-end to communicate with the back-end (here).

+ **Mongoose**: A library to easily communicate with the MongoDB database.

+ **Mocha**: A test runner to perform assertion tests.

+ **Chai**: A test library, in-junction with Mocha, that will perform the tests.
  - *Chai-HTTP*: Chai Plugin that will help with performing HTTP requests with *Express*.
  - *Chai-String*: Chain Plugin that will perform string tests like sub-string finding.

+ **PDF.js**: A JavaScript library to help work with the PDF files like retrieving the first page to act as the cover of an eBook entry.