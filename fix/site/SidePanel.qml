// SPDX-License-Identifier: AGPL-3.0-or-later
// © Société des arts technologiques
import QtQuick
import ca.qc.sat.qmlcomponents

// Slide-over side panel that animates in from the left or right edge of its
// parent, selected with `edge` (Qt.LeftEdge or Qt.RightEdge, default right).
//
// A discrete hamburger button toggles the panel: pinned to the panel's outer
// top corner when closed, it slides inward with the panel as it opens. A light
// scrim fades in behind the open panel and dismisses it when clicked.
// Give the component a parent that fills the window and it overlays everything
// declared before it:
//
//   SidePanel {
//       anchors.fill: parent
//       ScrollView { anchors.fill: parent; /* host content */ }
//   }
//
// Child items declared inside a SidePanel are its panel body: they are the
// default `content` slot and fill the whole panel. `open` is bindable from
// the host and `panelWidth` sets the width of the sliding surface.
Item {
    id: root

    property bool open: false
    property int panelWidth: 320

    // Edge the panel slides in from: Qt.LeftEdge or Qt.RightEdge.
    property int edge: Qt.RightEdge
    readonly property bool _fromLeft: root.edge === Qt.LeftEdge

    // Host-injected panel body (default slot). Children declared inside a
    // SidePanel are reparented into the content holder below.
    default property alias content: contentHolder.data

    // Overlay above sibling content declared earlier in the parent.
    z: 100

    // #rrggbb form of the active text colour for embedding in the SVG markup
    // (SVG does not accept Qt's #aarrggbb string form).
    readonly property string _iconColor: {
        function h(v) { var s = Math.round(v * 255).toString(16); return s.length < 2 ? "0" + s : s }
        return "#" + h(Theme.textColor.r) + h(Theme.textColor.g) + h(Theme.textColor.b)
    }

    // ---- Scrim: dims the content and closes the panel when clicked away ----
    Rectangle {
        id: scrim
        anchors.fill: parent
        color: "#000000"
        opacity: root.open ? 0.35 : 0.0
        visible: opacity > 0

        Behavior on opacity {
            NumberAnimation { duration: Theme.animationDuration; easing.type: Easing.InOutQuad }
        }

        MouseArea {
            anchors.fill: parent
            enabled: root.open
            onClicked: root.open = false
        }
    }

    // ---- Sliding panel ----
    Rectangle {
        id: panel
        objectName: "panel"
        anchors.top: parent.top
        anchors.bottom: parent.bottom
        width: root.panelWidth
        x: root._fromLeft ? (root.open ? 0 : -width)
                          : (root.open ? parent.width - width : parent.width)
        color: Theme.backgroundColor

        Behavior on x {
            NumberAnimation { duration: Theme.animationDuration; easing.type: Easing.InOutQuad }
        }

        // Separator on the panel's inner edge, against the underlying content.
        Rectangle {
            anchors {
                left: root._fromLeft ? undefined : parent.left
                right: root._fromLeft ? parent.right : undefined
                top: parent.top
                bottom: parent.bottom
            }
            width: 1
            color: Theme.separatorColor
        }

        // Swallow clicks so they do not fall through to the scrim/content.
        MouseArea { anchors.fill: parent }

        // Host content area. The toggle slides clear of the panel when open,
        // so the body gets the full panel — no reserved strip.
        Item {
            id: contentHolder
            anchors.fill: parent
        }
    }

    // ---- Discrete hamburger toggle, pinned to the panel's outer corner ----
    Item {
        id: toggle
        width: Theme.buttonHeight
        height: Theme.buttonHeight
        anchors.top: parent.top
        anchors.topMargin: Theme.padding
        // Pinned to the panel's outer top corner when closed; slides inward to
        // just outside the panel as it opens, in lockstep with the panel.
        x: root._fromLeft
           ? (root.open ? root.panelWidth + Theme.padding : Theme.padding)
           : (root.open ? parent.width - root.panelWidth - width - Theme.padding
                        : parent.width - width - Theme.padding)
        z: 1   // above the panel so it always toggles

        Behavior on x {
            NumberAnimation { duration: Theme.animationDuration; easing.type: Easing.InOutQuad }
        }

        Rectangle {
            anchors.fill: parent
            radius: Theme.borderRadius
            color: toggleArea.containsMouse ? Theme.buttonBgHover : Theme.buttonBgInactive
            Behavior on color { ColorAnimation { duration: Theme.animationDuration / 2 } }
        }

        //    _
        //  _(_)_   The web build carries no SVG image decoder, so the inline
        // (_)@(_)  SVG drew nothing (a blank button). The same three lines,
        //   (_)\   drawn as rectangles.
        //      |
        Column {
            objectName: "hamburgerIcon"
            anchors.centerIn: parent
            spacing: 3
            Repeater {
                model: 3
                Rectangle { width: 16; height: 2; radius: 1; color: root._iconColor }
            }
        }

        MouseArea {
            id: toggleArea
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: root.open = !root.open
        }
    }
}
