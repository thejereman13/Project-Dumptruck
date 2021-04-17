import { h } from "preact";
import { mount } from "enzyme";
import { VideoDisplayCard, VideoCardInfo } from "../../components/displayCards/VideoCard";

describe("Video Card", () => {
    it("Renders Correctly", () => {
        const videoInfo: VideoCardInfo = {
            channel: "Sample Channel",
            id: "htYR2GdA7OE",
            thumbnailURL: "https://i.ytimg.com/vi/htYR2GdA7OE/default.jpg",
            title: "Sample Title",
            duration: 96
        };
        const wrapper = mount(<VideoDisplayCard info={videoInfo} />);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find("img")).toHaveLength(1);
        expect(wrapper.find("img").prop("src")).toEqual(videoInfo.thumbnailURL);
        expect(wrapper.find(".mui--text-subhead")).toHaveLength(1);
        expect(wrapper.find(".mui--text-subhead").text()).toEqual(videoInfo.title);
        expect(wrapper.find(".mui--text-body1")).toHaveLength(2);
        expect(
            wrapper
                .find(".mui--text-body1")
                .last()
                .text()
        ).toEqual(videoInfo.channel);
        expect(
            wrapper
                .find(".mui--text-body1")
                .first()
                .text()
        ).toEqual("01:36");
    });

    it("Clicks", () => {
        const videoInfo: VideoCardInfo = {
            channel: "Sample Channel",
            id: "htYR2GdA7OE",
            thumbnailURL: "https://i.ytimg.com/vi/htYR2GdA7OE/default.jpg",
            title: "Sample Title",
            duration: 90
        };
        const click = jest.fn();
        const wrapper = mount(<VideoDisplayCard info={videoInfo} onClick={click} />);
        expect(wrapper.exists()).toBe(true);
        const button = wrapper.find("button");
        expect(button).toHaveLength(1);
        expect(click).toHaveBeenCalledTimes(0);
        button.simulate("click");
        expect(click).toHaveBeenCalledTimes(1);
        expect(click).toHaveBeenCalledWith(videoInfo.id);
    });

    it("Renders the Action Component", () => {
        const videoInfo: VideoCardInfo = {
            channel: "Sample Channel",
            id: "htYR2GdA7OE",
            thumbnailURL: "https://i.ytimg.com/vi/htYR2GdA7OE/default.jpg",
            title: "Sample Title",
            duration: 90
        };
        const actionText = "Action Text";
        const action = <div id="act">{actionText}</div>;
        const wrapper = mount(<VideoDisplayCard info={videoInfo} actionComponent={action} />);
        expect(wrapper.exists()).toBe(true);
        const act = wrapper.find("#act");
        expect(act).toHaveLength(1);
        expect(act.text()).toEqual("Action Text");
        expect(wrapper.text().indexOf(actionText)).toEqual(wrapper.text().length - actionText.length);
    });
});
