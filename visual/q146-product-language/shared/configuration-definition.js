/* Generated from source/configuration-source.json; display labels never alter configuration values. */
(() => {
	const source = {
  "version": "sgg.configuration/1",
  "provenance": "Existing q64 ExperienceBundle config; no new gameplay settings. Player count is owned by preparation seats.",
  "tools": [
    {
      "id": "profile",
      "label": "资料"
    },
    {
      "id": "forum",
      "label": "论坛"
    },
    {
      "id": "messages",
      "label": "私信"
    },
    {
      "id": "ratings",
      "label": "评分"
    }
  ],
  "games": {
    "trust": {
      "rounds": 5,
      "communication": 1,
      "extraFields": []
    },
    "network-pd": {
      "rounds": 5,
      "communication": 1,
      "extraFields": [
        {
          "key": "disclosure",
          "label": "结算信息",
          "options": [
            {
              "value": "actions",
              "label": "邻居动作与边收益"
            },
            {
              "value": "payoff_only",
              "label": "本人动作与边收益"
            }
          ]
        }
      ],
      "disclosure": "actions"
    },
    "ultimatum": {
      "rounds": 3,
      "communication": 1,
      "extraFields": []
    },
    "best-shot": {
      "rounds": 5,
      "communication": 1,
      "extraFields": []
    },
    "stag-hunt": {
      "rounds": 3,
      "communication": 1,
      "extraFields": [],
      "rationalFields": [
        {
          "key": "AA",
          "label": "双方选择 A",
          "value": {
            "n": "4",
            "d": "1"
          }
        },
        {
          "key": "BA",
          "label": "自己 B、伙伴 A",
          "value": {
            "n": "3",
            "d": "1"
          }
        },
        {
          "key": "BB",
          "label": "双方选择 B",
          "value": {
            "n": "2",
            "d": "1"
          }
        },
        {
          "key": "AB",
          "label": "自己 A、伙伴 B",
          "value": {
            "n": "0",
            "d": "1"
          }
        }
      ],
      "strictOrder": [
        "AA",
        "BA",
        "BB",
        "AB"
      ]
    },
    "dictator": {
      "rounds": 3,
      "communication": 1,
      "extraFields": []
    },
    "threshold-public-good": {
      "rounds": 3,
      "communication": 1,
      "extraFields": [
        {
          "key": "institution",
          "label": "固定制度",
          "defaultValue": "R1",
          "options": [
            {
              "value": "R1",
              "label": "R1 · 贡献至少1"
            },
            {
              "value": "R3",
              "label": "R3 · 贡献至少3"
            }
          ]
        }
      ]
    },
    "hidden-profile": {
      "rounds": 5,
      "communication": 1,
      "extraFields": []
    },
    "double-auction": {
      "rounds": 3,
      "communication": 1,
      "extraFields": []
    },
    "cooperative-search": {
      "rounds": 3,
      "communication": 0,
      "extraFields": []
    }
  }
};
	const label = (value) =>
		Object.defineProperty({ ...value }, "label", {
			enumerable: true,
			get: () => SGGI18n.systemCopy(value.label),
		});
	window.SGGConfigurationDefinition = {
		...source,
		tools: source.tools.map(label),
		games: Object.fromEntries(
			Object.entries(source.games).map(([id, game]) => [
				id,
				{
					...game,
					extraFields: game.extraFields.map((field) =>
						label({ ...field, options: field.options.map(label) }),
					),
					...(game.rationalFields ? { rationalFields: game.rationalFields.map(label) } : {}),
				},
			]),
		),
	};
})();
