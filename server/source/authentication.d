module authentication;

import vibe.vibe;
import std.stdio;

import database;


void createUser(HTTPServerRequest req, HTTPServerResponse res) {
    string userName = req.json["User"].to!string;
    string pass = req.json["Pass"].to!string;
    int role = req.json["Role"].to!int;
    if (req.session && req.session.get!int("role") > 1) {
        if (database.addUser(userName, pass, role)) {
            res.writeJsonBody("{}", 201, false);
            return;
        }
    }
    res.writeJsonBody("{}", 401, false);
}

void updateUser(HTTPServerRequest req, HTTPServerResponse res) {
    string userName = req.json["User"].to!string;
    if ("Pass" in req.json && "NewPass" in req.json) {  //Updating user's own password
        string oldpass = req.json["Pass"].to!string;
        string newpass = req.json["NewPass"].to!string;
        if (database.authenticateUser(userName, oldpass)) {
            updateUserPassword(userName, newpass);
            res.writeJsonBody("{}", 201, false);
            return;
        }
    } else if ("Role" in req.json) {                    //Updating a user's role
        const int newRole = req.json["Role"].to!int;
        updateUserRole(userName, newRole);
        res.writeJsonBody("{}", 201, false);
    }
    res.writeJsonBody("{}", 401, false);
}

void removeUser(HTTPServerRequest req, HTTPServerResponse res) {
    string userName = req.json["User"].to!string;
    database.deleteUser(userName);
    res.writeJsonBody("{}", 201, false);
}

//TODO: add levels of Role restrictions
void checkUserLogin(HTTPServerRequest req, HTTPServerResponse res) {
    if (!req.session) {
        res.writeBody("", 401);
        res.redirect("/");
    } else {
        //writeln("Authenticated Request");
    }
}

//Authenticates and logs in a user
void userLogin(HTTPServerRequest req, HTTPServerResponse res) {
    string userName = req.json["User"].to!string;
    string pass = req.json["Pass"].to!string;
    if (auto r = database.authenticateUser(userName, pass)) {
        Json userResponse = Json.emptyObject;
        if (req.session)
            res.terminateSession();
        auto session = res.startSession();
        session.set("username", userName);
        session.set("role", r);
        userResponse["User"] = userName;
        userResponse["Role"] = r;
        res.writeJsonBody(userResponse, 200, false);
    } else {
        res.writeJsonBody("{}", 401, false);
    }
}

//Returns the username of the current session if logged in
void getUserLogin(HTTPServerRequest req, HTTPServerResponse res) {
    Json currentUser = Json.emptyObject;
    
    if (req.session) {
        currentUser["User"] = req.session.get!string("username");
        currentUser["Role"] =req.session.get!int("role");
    } else {
        currentUser["User"] = null;
    }
    res.writeJsonBody(currentUser, 200, false);
}

//Logs out any user session
void userLogout(HTTPServerRequest req, HTTPServerResponse res) {
    if (req.session) {
        res.terminateSession();
    }
    res.writeJsonBody("{}", 200, false);
}

//Returns the User data JSON
void getUserJSON(HTTPServerRequest req, HTTPServerResponse res) {
    Json userData = Json.emptyObject;
    if (req.session) {
        string user = req.session.get!string("username");
        const string dat = database.getUserData(user);
        if (dat.length > 0) {
            userData["Data"] = dat;
            userData["User"] = user;
            res.writeJsonBody(userData, 200, false);
            return;
        }
    }
    res.writeJsonBody(userData, 400, false);
}

void setUserJSON(HTTPServerRequest req, HTTPServerResponse res) {
    Json userData = req.json["Data"];
    if (req.session) {
        string user = req.session.get!string("username");
        database.setUserData(userData.toString(), user);
        res.writeJsonBody("{}", 201, false);
        return;
    }
    res.writeJsonBody("{}", 401, false);
}
