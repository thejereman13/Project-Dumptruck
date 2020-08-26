module authentication;

import vibe.vibe;
import std.stdio;
import std.uuid;

import database;
import user;

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

void validateToken(string clientId, string token, HTTPServerResponse response) {
    //  TODO: use JWT token validation of API calls
    //  https://developers.google.com/identity/sign-in/web/backend-auth#calling-the-tokeninfo-endpoint
    try {
        requestHTTP("https://oauth2.googleapis.com/tokeninfo?id_token=" ~ token, (scope req) {
            req.method = HTTPMethod.GET;
        }, (scope res) {
            const b = res.readJson();
            if (b["aud"].get!string == "841595651790-s771569jg29jlktsq4ac4nk56fg0coht.apps.googleusercontent.com" &&
                b["sub"] == clientId) {
                auto user = makeSiteUser(b["sub"].get!string, b["name"].get!string, b["email"].get!string);
                auto session = response.startSession();
                session.set("clientID", user.id);
                response.writeJsonBody(serializeToJson(user), 200, false);
            }
        });
    } catch (Exception e) {
        logException(e, "Failed to Verify User Token");
        response.writeJsonBody("{}", 401, false);
    }
}

void validateExistingLogin(HTTPServerRequest req, HTTPServerResponse res) {
    auto user = getSiteUser(req.session.get!UUID("clientID"));
    if (!user.id.empty && user.googleID.length > 0 && req.json["clientId"] == user.googleID) {
        res.writeJsonBody(serializeToJson(user), 201, false);
    } else {
        res.terminateSession();
        res.writeJsonBody("{}", 401, false);
    }
}

//Authenticates and logs in a user
void userLogin(HTTPServerRequest req, HTTPServerResponse res) {
    if (req.session) {
        validateExistingLogin(req, res);
    } else {
        writeln("Logging in User");
        validateToken(req.json["clientId"].get!string, req.json["token"].get!string, res);
    }
    // authenticate with google using token id, associate the api id with the session
    // new(?) websocket sessions read a valid api id to determine if guest
    // or can find the DB information for a logged-in user
}

//Returns the username of the current session if logged in
void getUserLogin(HTTPServerRequest req, HTTPServerResponse res) {
    Json currentUser = Json.emptyObject;
    
    if (req.session) {
        currentUser["User"] = req.session.get!string("username");
        currentUser["Role"] = req.session.get!int("role");
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
