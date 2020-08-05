import { h, JSX } from "preact";
import { PlaylistByUser } from "../../utils/WebsocketTypes";
import { RoomUser } from "../../utils/BackendTypes";
import Button from "preact-mui/lib/button";
import { VideoCard } from "../../components/VideoCard";

export interface VideoQueueProps {
    videoPlaylist: PlaylistByUser;
    userQueue: string[];
    currentUsers: RoomUser[];
}

export function VideoQueue(props: VideoQueueProps): JSX.Element {
    const { userQueue, videoPlaylist, currentUsers } = props;
    return (
        <div>
            <h2>Upcoming Videos:</h2>
            {userQueue.map(clientID => {
                // <div class="mui--text-title" key={v.youtubeID}>{v.title}</div>
                const playlist = videoPlaylist[clientID];
                const playlistUser = currentUsers.find(u => u.clientID == clientID);
                return (
                    <div key={clientID}>
                        <Button variant="flat">{playlistUser?.name ?? "Unknown User"}</Button>
                        {playlist && playlist.map(v => <VideoCard key={v.youtubeID} videoID={v.youtubeID} />)}
                    </div>
                );
            })}
        </div>
    );
}
