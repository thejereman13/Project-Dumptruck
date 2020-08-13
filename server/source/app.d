import vibe.vibe;
import vibe.http.websockets;
import vibe.core.sync;
import vibe.core.log;
import std.uuid;
import std.stdio;
import std.functional;
import core.thread;
import core.sync.mutex;

import sockets;
import configuration;
import authentication;
import video;
import user;

const WebServerVersion = "1.0.5";

version(release)
void main()
{

	readConfigFile();

	auto settings = new HTTPServerSettings;
	settings.bindAddresses = ["::1", "0.0.0.0"];

	settings.port = server_configuration["web_port"].get!ushort;
	settings.tlsContext = createTLSContext(TLSContextKind.server);
	settings.tlsContext.useCertificateChainFile(server_configuration["ssl_cert"].to!string);
	settings.tlsContext.usePrivateKeyFile(server_configuration["ssl_key"].to!string);
	settings.sessionStore = new MemorySessionStore;

	// setLogLevel(LogLevel.debugV);

	setup();

	auto router = new URLRouter;
	router.get("*", serveStaticFiles(server_configuration["web_dir"].get!string));
	router.get("/api/ws", handleWebSockets(&handleWebsocketConnection));
	router.post("/api/login", &userLogin);
	router.get("/api/login", &getUserLogin);
	router.post("/api/logout", &userLogout);
	router.get("/api/video/:id", &videoInfoRequest);
	router.get("/api/user", &getUserInfo);

	// router.any("*", &checkUserLogin);
	// router.get("/userData", &getUserJSON);
	// router.put("/userData", &setUserJSON);
	// router.post("/user", &createUser);
	// router.put("/user", &updateUser);
	// router.delete_("/user", &removeUser);
	auto l = listenHTTP(settings, router);
	scope(exit) {
		l.stopListening();
		writeln("Server Closing\n");
	}

	runApplication();
}

void setup() {
	// initializeDBConnection();
}