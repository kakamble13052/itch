import * as React from "react";
import { connect } from "../connect";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import { ICave } from "../../db/models/cave";

import colors from "../../constants/colors";

import JSONTree from "react-json-tree";

const theme = {
  scheme: "monokai",
  author: "wimer hazenberg (http://www.monokai.nl)",
  base00: colors.darkMineShaft,
  base01: "#383830",
  base02: "#49483e",
  base03: "#75715e",
  base04: "#a59f85",
  base05: "#f8f8f2",
  base06: "#f5f4f1",
  base07: "#f9f8f5",
  base08: "#f92672",
  base09: "#fd971f",
  base0A: "#f4bf75",
  base0B: "#a6e22e",
  base0C: "#a1efe4",
  base0D: "#66d9ef",
  base0E: "#ae81ff",
  base0F: "#cc6633",
};

export class ViewCaveDetails extends React.PureComponent<IProps> {
  render() {
    const params = this.props.modal.widgetParams as IViewCaveDetailsParams;

    return (
      <ModalWidgetDiv>
        <p>Local cave record:</p>

        <div className="json-tree-container">
          <JSONTree
            data={params.currentCave}
            theme={theme}
            invertTheme={false}
          />
        </div>
      </ModalWidgetDiv>
    );
  }
}

export interface IViewCaveDetailsParams {
  currentCave: ICave;
}

interface IProps extends IModalWidgetProps {
  params: IViewCaveDetailsParams;
}

export default connect<IProps>(ViewCaveDetails);
