import { fireEvent, render, screen } from "@testing-library/react-native";

import { OptionChips } from "./OptionChips";

describe("OptionChips", () => {
  const options = ["fridge", "pantry", "freezer"] as const;

  it("renders a chip for every option", async () => {
    await render(
      <OptionChips options={options} value={null} onChange={jest.fn()} />,
    );
    for (const option of options) {
      expect(screen.getByText(option)).toBeTruthy();
    }
  });

  it("calls onChange with the tapped option", async () => {
    const onChange = jest.fn();
    await render(<OptionChips options={options} value={null} onChange={onChange} />);

    await fireEvent.press(screen.getByText("pantry"));

    expect(onChange).toHaveBeenCalledWith("pantry");
  });

  it("clears instead of re-selecting when the selected chip is tapped again", async () => {
    const onChange = jest.fn();
    const onClear = jest.fn();
    await render(
      <OptionChips
        options={options}
        value="fridge"
        onChange={onChange}
        allowClear
        onClear={onClear}
      />,
    );

    await fireEvent.press(screen.getByText("fridge"));

    expect(onClear).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
