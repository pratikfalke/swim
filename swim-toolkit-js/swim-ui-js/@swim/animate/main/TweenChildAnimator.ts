// Copyright 2015-2020 Swim inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Transition} from "@swim/transition";
import {AnimatorContext} from "./AnimatorContext";
import {Animator} from "./Animator";
import {TweenAnimator} from "./TweenAnimator";

export class TweenChildAnimator<T> extends TweenAnimator<T> {
  parent: AnimatorContext | null;

  constructor(parent: AnimatorContext | null, value: T | undefined, transition: Transition<T> | null) {
    super(value, transition);
    this.parent = parent;
  }

  animate(animator: Animator = this): void {
    const parent = this.parent;
    if (parent !== null && this._enabled) {
      parent.animate(animator);
    }
  }

  update(newValue: T | undefined, oldValue: T | undefined): void {
    // hook
  }

  cancel(): void {
    // nop
  }

  delete(): void {
    // nop
  }
}
