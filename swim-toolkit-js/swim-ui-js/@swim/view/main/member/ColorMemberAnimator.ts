// Copyright 2015-2020 SWIM.AI inc.
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

import {__extends} from "tslib";
import {AnyColor, Color} from "@swim/color";
import {Transition, Tween} from "@swim/transition";
import {AnimatedView} from "../animated/AnimatedView";
import {MemberAnimatorConstructor, MemberAnimator} from "./MemberAnimator";

/** @hidden */
export interface ColorMemberAnimator<V extends AnimatedView> extends MemberAnimator<V, Color, AnyColor> {
}

/** @hidden */
export const ColorMemberAnimator: MemberAnimatorConstructor<Color, AnyColor> = (function (_super: typeof MemberAnimator): MemberAnimatorConstructor<Color, AnyColor> {
  const ColorMemberAnimator: MemberAnimatorConstructor<Color, AnyColor> = function <V extends AnimatedView>(
      this: ColorMemberAnimator<V>, view: V, animatorName: string | undefined, value?: AnyColor,
      transition?: Transition<Color> | null, inherit?: string | null): ColorMemberAnimator<V> {
    let _this: ColorMemberAnimator<V> = function accessor(value?: AnyColor, tween?: Tween<Color>): Color | undefined | V {
      if (arguments.length === 0) {
        return _this.value;
      } else {
        _this.setState(value, tween);
        return _this._view;
      }
    } as ColorMemberAnimator<V>;
    (_this as any).__proto__ = this;
    _this = _super.call(_this, view, animatorName, value, transition, inherit) || _this;
    return _this;
  } as unknown as MemberAnimatorConstructor<Color, AnyColor>;
  __extends(ColorMemberAnimator, _super);

  ColorMemberAnimator.prototype.fromAny = function (this: ColorMemberAnimator<AnimatedView>, value: AnyColor | null): Color | null {
    return value !== null ? Color.fromAny(value) : null;
  };

  return ColorMemberAnimator;
}(MemberAnimator));
MemberAnimator.Color = ColorMemberAnimator;
