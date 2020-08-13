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
    console.log(props);
    return (
        <div>
            {userQueue.map(clientID => {
                const playlist = videoPlaylist[clientID];
                const playlistUser = currentUsers.find(u => u.clientID == clientID);
                console.log(playlist);
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
