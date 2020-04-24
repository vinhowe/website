---
title: Build It Fast With Flutter
date: 2020-03-14T04:35:00.000Z
description: Brought to you by COVID-19
---
*The content of this post is adapted from a workshop that I was originally scheduled to host at BYU ACM's hackathon, the YHack, before it—along with everything else at BYU—was cancelled in response to the COVID-19 pandemic. Slides from my presentation are [here](https://docs.google.com/presentation/d/1PHiiXvkmM-mq_NXW9mDVhnGIrq0Aw9IUwKie4ASuCsc/edit?usp=sharing).*

## A quick introduction to Flutter

I'm going to try to sell you on Flutter without getting into the specifics. I'm hoping that if this is your first real exposure to Flutter, it will get you excited enough to explore more on your own. 

### What is Flutter?

From [Flutter’s website](https://flutter.dev):﻿

“Flutter is **Google’s UI toolkit** for building **beautiful**, **natively compiled** applications for **mobile**, **web**, and **desktop** from a **single codebase**." (emphasis mine)

The Flutter team at Google is trying to create a fast, truly cross-platform development toolkit. As of today, Flutter for the web and desktop are still far from production-ready, so we’ll be focusing on mobile.

### Why use Flutter?

#### Development speed

![](/images/flutter-hot-reload-demo.gif)

Changes in UI can be applied virtually instantly with Flutter’s [hot reload](https://flutter.dev/docs/development/tools/hot-reload). This is a big part of what makes building interfaces in Flutter so easy.

#### Flutter makes it simple to build beautiful UI

![](/images/flutter-design-demo.png)

Out of the box, Flutter provides:

* An amazing selection of styled UI components--"widgets"--to match the styles of [Android](https://flutter.dev/docs/development/ui/widgets/material) and [iOS](https://flutter.dev/docs/development/ui/widgets/cupertino)
* Everything you need to create an app that looks exactly what you want (check out Flutter's extensive [widget catalog](https://flutter.dev/docs/development/ui/widgets))

#### It's cross-platform!

For mobile development, Flutter runs on both Android and iOS **natively**. If you're new to app development, the appeal of this might not be clear immediately. If you're experienced, skip ahead!

Professional app developers usually want an app to be able to run on both of the major mobile operating systems, Android and iOS. But they are profoundly different beasts:

* Android, built by Google, runs apps written in Java and/or Kotlin using the Android SDK
* iOS, built by Apple, runs apps written in Swift or Objective-C using Apple's iOS APIs

Writing a high-quality app that runs well on either Android or iOS alone can be a full-time job. Building for both is effectively like writing two separate apps. This means keeping up with changes to the APIs and style updates of both operating systems, both on different release cycles. Hopefully it's easy to see why the promise of a development platform that can cut this time commitment *in half* might be attractive.

And yes, there's [React Native](https://reactnative.dev), among others ([PhoneGap](https://phonegap.com), [Cordova](https://cordova.apache.org), et al.). Cross-platform toolkits like React Native tend to rely on a JavaScript runtime of some form. This works well for many use cases. [Instagram](https://instagram-engineering.com/react-native-at-instagram-dd828a9a90c7), [Pinterest](https://medium.com/pinterest-engineering/supporting-react-native-at-pinterest-f8c2233f90e6), Tesla, and [many others](https://reactnative.dev/showcase) uses React Native and probably love it. But these frameworks tend to be less performant than Flutter and lack its opinionated-but-flexible UI philosophy. There's a [fantastic article](https://hackernoon.com/whats-revolutionary-about-flutter-946915b09514) by Wm Leler that goes into detail about how Flutter stacks up against the approach that React Native uses.

## Demo

*I'm considering doing a write-up on the demo I originally planned to code live for the workshop at the YHack. For now, here's a [link](https://github.com/vinhowe/flutter-magic-8-ball) to the "ground truth" build I did a few weeks ago. Open an issue or a PR if you see something!*
