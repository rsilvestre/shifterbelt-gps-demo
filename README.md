# Shifterbelt gps demo
Just a small demo of how to use shifterbelt in a gps tracking project

## Create a shifterbelt project

First you need to create a [shifterbelt project](http://www.shifterbelt.com) on [http://www.shifterbelt.com](http://www.shifterbelt.com)

You need to create an account, validate you email, chose a tariff plan and create an application.

## Launch project

You have 2 possibilities. Modify the source code, or juste passing some variables when you launch the server :

1. Modify the source code

    Edit the file bin/www and replace :

    ```
var shifterbeltClient = new ShifterbeltClient({
  url: String(process.argv.slice(2,3)[0]),
  applicationId: Number(process.argv.slice(3, 4)[0]),
  key: process.argv.slice(4, 5)[0],
  password: process.argv.slice(5, 6)[0]
});
    ```

    by:

    ```
var shifterbeltClient = new ShifterbeltClient({
  applicationId: APPLICATION_ID,
  key: APPLICATION_MASTER_KEY,
  password: APPLICATION_MASTER_PASSWORD
});
    ```

2. Pass some variables

    To run the application by passing some variables, juste execute :

    ```
http://socket.shifterbelt.com/ns APPLICATION_ID APPLICATION_MASTER_KEY APPLICATION_MASTER_PASSWORD
    ```

