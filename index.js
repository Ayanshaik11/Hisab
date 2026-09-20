import React from "react";
import { ScrollView, Text, View } from "react-native";
import { registerRootComponent } from "expo";

// If anything goes wrong, show the error on screen (so you can screenshot it)
// instead of the app silently closing.
function ErrorScreen({ error }) {
  const text = String((error && (error.stack || error.message)) || error);

  return (
    <View style={{ flex: 1, backgroundColor: "#200", paddingTop: 60, paddingHorizontal: 16 }}>
      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
        Hisab hit an error
      </Text>
      <Text style={{ color: "#fbb", marginBottom: 12 }}>
        Take a screenshot of this screen and send it.
      </Text>
      <ScrollView>
        <Text selectable style={{ color: "#fff", fontSize: 12 }}>
          {text}
        </Text>
      </ScrollView>
    </View>
  );
}

class Boundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidMount() {
    // Errors that happen later (buttons, network...) are shown instead of closing the app
    if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
      global.ErrorUtils.setGlobalHandler((error) => {
        this.setState({ error });
      });
    }
  }

  render() {
    if (this.state.error) return <ErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}

let App = null;
let startupError = null;

try {
  App = require("./App").default;
} catch (error) {
  startupError = error;
}

function Root() {
  if (startupError) return <ErrorScreen error={startupError} />;

  return (
    <Boundary>
      <App />
    </Boundary>
  );
}

registerRootComponent(Root);
