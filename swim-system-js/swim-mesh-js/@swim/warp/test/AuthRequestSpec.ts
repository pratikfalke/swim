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

import {TestOptions, Test, Spec, Report} from "@swim/unit";
import {Attr, Record} from "@swim/structure";
import {AuthRequest} from "@swim/warp";
import {WarpExam} from "./WarpExam";

export class AuthRequestSpec extends Spec {
  createExam(report: Report, name: string, options: TestOptions): WarpExam {
    return new WarpExam(report, this, name, options);
  }

  @Test
  parseAuth(exam: WarpExam): void {
    exam.parses("@auth", AuthRequest.of());
  }

  @Test
  parseAuthWithBody(exam: WarpExam): void {
    exam.parses("@auth@test", AuthRequest.of(Record.of(Attr.of("test"))));
  }

  @Test
  writeAuth(exam: WarpExam): void {
    exam.writes(AuthRequest.of(), "@auth");
  }

  @Test
  writeAuthWithBody(exam: WarpExam): void {
    exam.writes(AuthRequest.of(Record.of(Attr.of("test"))), "@auth@test");
  }
}
