import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useGoogleClientAPI } from "../../utils/GAPI";
import { GetCurrentUser } from "../../utils/RestCalls";
import { SiteUser } from "../../utils/BackendTypes";

function Home(): JSX.Element {
    const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);

    useGoogleClientAPI((success: boolean) => {
        if (!success) {
            console.warn("User Is Not Signed In");
        }
        window.gapi.client
            .request({
                path: "https://www.googleapis.com/youtube/v3/videos",
                params: {
                    part: "snippet,contentDetails",
                    id: "C0DPdy98e4c"
                }
            })
            .then(resp => {
                console.log(resp);
            });
    });

    useEffect(() => {
        GetCurrentUser().then(usr => {
            setCurrentUser(usr);
        });
    }, []);

    return (
        <div class={style.home}>
            <h1>Home</h1>
            {currentUser !== null && (
                <div>
                    <h3>Recent Rooms</h3>
                    {currentUser.recentRooms.map(room => (
                        <div class={style.roomRow} key={room}>
                            <Button onClick={(): boolean => route(`/room/${room}`)}>{`Room ${room}`}</Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Home;
