import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildMeetingDuplicateGroups,
  buildGeoBriefDuplicateGroups
} from "../../services/api-firebase/src/scripts/dedupe_showcase_data.js";

test("buildMeetingDuplicateGroups groups only duplicate meetings inside the requested namespace", () => {
  const groups = buildMeetingDuplicateGroups(
    [
      { id: "m1", location: "Portland Waterfront Growth Session [showcase-prod-v1]", tags: ["showcase-prod-v1"] },
      { id: "m2", location: "Portland Waterfront Growth Session [showcase-prod-v1]", tags: ["showcase-prod-v1"] },
      { id: "m3", location: "York Coastal Visitor Readiness Session [showcase-prod-v1]", tags: ["showcase-prod-v1"] },
      { id: "m4", location: "Portland Waterfront Growth Session [other]", tags: ["other"] }
    ],
    "showcase-prod-v1"
  );

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].map((item) => item.id), ["m1", "m2"]);
});

test("buildGeoBriefDuplicateGroups groups briefs by geo profile id", () => {
  const groups = buildGeoBriefDuplicateGroups([
    { id: "b1", geo_profile_id: "city_portland" },
    { id: "b2", geo_profile_id: "city_portland" },
    { id: "b3", geo_profile_id: "city_bangor" }
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].map((item) => item.id), ["b1", "b2"]);
});
