import { h } from "preact";
import { mount } from "enzyme";
import { Dropdown, DropdownOption } from "../../components/Dropdown";

describe("Dropdown Menu", () => {
    it("Renders Correctly", () => {
        const page = mount(<div id="app" />, { attachTo: document.body });
        const wrapper = mount(
            <Dropdown base={<div>Base Element</div>} open={false}>
                <DropdownOption>Option 1</DropdownOption>
                <DropdownOption>Option 2</DropdownOption>
            </Dropdown>
        );
        expect(page.exists()).toBe(true);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toEqual("Base Element");
        expect(wrapper.find("S").length).toEqual(0);
        wrapper.setProps({ open: true });
        wrapper.update();
        // No known way to find the actual DropdownOptions rendered through the portal
        // Only the S vNodes
        expect(wrapper.find("S").length).toEqual(2);
    });
});
