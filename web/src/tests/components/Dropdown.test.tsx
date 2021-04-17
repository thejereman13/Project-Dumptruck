import { h } from "preact";
import { mount } from "enzyme";
import { Dropdown } from "../../components/Dropdown";
import Button from "preact-mui/lib/button";

describe("Dropdown Menu", () => {
    it("Renders Correctly", () => {
        const page = mount(<div id="app" />, { attachTo: document.body });
        const wrapper = mount(
            <Dropdown
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                base={(open) => (
                    <Button onClick={open} id="btn1">
                        Base Element
                    </Button>
                )}
                options={[{ display: "Option 1" }, { display: "Option 2" }]}
            />
        );
        expect(page.exists()).toBe(true);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toEqual("Base Element");
        expect(wrapper.find("S").length).toEqual(0);
        wrapper
            .find("#btn1")
            .last()
            .simulate("click");
        wrapper.update();
        // No known way to find the actual DropdownOptions rendered through the portal
        // Only the S vNodes
        expect(wrapper.find("S").length).toEqual(2);
    });
});
