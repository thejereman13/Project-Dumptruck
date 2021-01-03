module site_user;

import vibe.vibe;
import std.uuid;
import std.algorithm;
import std.array;

import DB = database;

struct SiteUser {
    UUID id;
    string googleID;
    string name;
    string email;
    long[] recentRooms;
}

private SiteUser constructSiteUser(Json data) {
    if (data["googleID"].type() != Json.Type.undefined) {
        return SiteUser(
            UUID(data["id"].get!string),
            data["googleID"].get!string,
            data["name"].get!string,
            data["email"].get!string,
            data["recentRooms"].get!(Json[]).map!(j => j.get!long).array
        );
    }
    return SiteUser.init;
}

SiteUser makeSiteUser(string googleID, string name, string email) {
    const UUID foundID = DB.findGIDUser(googleID);
    if (!foundID.empty) {
        Json data = parseJsonString(DB.getUserData(foundID));
        auto su = constructSiteUser(data);
        if (!su.id.empty) return su;
    }
    SiteUser newUser = SiteUser(randomUUID(), googleID, name, email, []);
    DB.setUserData(newUser.id, serializeToJsonString(newUser));
    DB.setUserGID(newUser.id, googleID);
    return newUser;
}

void addRecentRoomToUser(UUID clientID, long roomID) {
    Json data = parseJsonString(DB.getUserData(clientID));
    if (data["googleID"].type() != Json.Type.undefined) {
        long[] recentRooms = data["recentRooms"].get!(Json[]).map!(j => j.get!long).array;
        if (!recentRooms.any!(r => r == roomID)) {
            recentRooms ~= roomID;
        } else {
            const index = recentRooms.countUntil!(r => r == roomID);
            recentRooms = recentRooms.remove(index);
            recentRooms ~= roomID;
        }
        data["recentRooms"] = serializeToJson(recentRooms);
        DB.setUserData(clientID, data.toString());
    }
}

SiteUser getSiteUser(UUID clientID) {
    if (clientID.empty) return SiteUser.init;
    Json data = parseJsonString(DB.getUserData(clientID));
    return constructSiteUser(data);
}

void getUserInfo(HTTPServerRequest req, HTTPServerResponse res) {
    if (req.session && req.session.isKeySet("clientID")) {
        auto id = req.session.get!UUID("clientID");
        Json data = parseJsonString(DB.getUserData(id));
        res.writeJsonBody(data, 201, false);
        return;
    }
    res.writeJsonBody("{}", 400, false);
}

void clearUserInfo(HTTPServerRequest req, HTTPServerResponse res) {
    if (req.session && req.session.isKeySet("clientID")) {
        auto id = req.session.get!UUID("clientID");
        if (DB.clearUserData(id)) {
            res.writeJsonBody("{}", 201, false);
            return;
        }
    }
    res.writeJsonBody("{}", 401, false);
}

void getPublicUserInfo(HTTPServerRequest req, HTTPServerResponse res) {
    const UUID userID = UUID(req.params["id"].to!string);

    if (!userID.empty) {
        SiteUser u = constructSiteUser(parseJsonString(DB.getUserData(userID)));
        if (!u.id.empty) {
            // Remove sensitive Information
            u.googleID = "";
            u.email = "";
            res.writeJsonBody(serializeToJson(u), 201, false);
            return;
        }
    }
    res.writeJsonBody("{}", 400, false);
}