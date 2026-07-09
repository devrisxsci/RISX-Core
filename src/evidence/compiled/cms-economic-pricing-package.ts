/**
 * Stage 3: Compiled CMS Medicare Economic Pricing Evidence Package artifact.
 *
 * Verbatim output of RISX-Knowledge-Compiler v1.0.0 (compilerId
 * "risx-knowledge-compiler"), compiled from the real CMS ASP Quarterly
 * Pricing File + NDC-HCPCS Crosswalk capture (October 2025 / 2025Q4).
 * paymentLimitMicroUsd values match the CMS public-use file to the cent
 * (e.g. J9271 = 60_291_000 µUSD = $60.291). Scoped to the NSCLC HCPCS codes
 * resolvable from the drug-identity package (J9271, J9045, J9305).
 *
 * Committed data artifact — NOT generated at build time.
 * manifestHash: b4a084fd3e509d44d53efce008e64d7adcdee2648440fe932d4b6e7e3ae6c9a0
 */

type Sha256Hash = { algorithm: "sha256"; digest: string };

export const COMPILED_ECONOMIC_PACKAGE_DATA: {
  manifest: {
    objectType: "EvidencePackageManifest";
    packageKind: "evidence";
    packageId: string;
    version: string;
    compilerId: string;
    compilerVersion: string;
    headerHash: Sha256Hash;
    metadataHash: Sha256Hash;
    bodyHashes: Sha256Hash[];
    supportingResourceHashes: Sha256Hash[];
    manifestHash: Sha256Hash;
    signature: { signedBy: string; value: string };
    compatibleWith: string[];
    createdAt: string;
    evidenceObjectIds: string[];
    provenancePointers: string[];
  };
  source: string;
  assertions: Array<{
    assertionId: string;
    evidenceCategory: string;
    claim: unknown;
    citation: string;
  }>;
} = {
  "manifest": {
    "objectType": "EvidencePackageManifest",
    "packageKind": "evidence",
    "packageId": "cms-economic-pricing-nsclc",
    "version": "2025.4.0+CMS-ASP-2025Q4",
    "compilerId": "risx-knowledge-compiler",
    "compilerVersion": "1.0.0",
    "headerHash": {
      "algorithm": "sha256",
      "digest": "23c28c6fdea0c188f73f038c1f989c2f3de199ec4b49697f9fc89cfe5b9e28e4"
    },
    "metadataHash": {
      "algorithm": "sha256",
      "digest": "1fb5620fed82179fbc2baef2116b187465dd204bdb60dd18a222588382b69320"
    },
    "bodyHashes": [
      {
        "algorithm": "sha256",
        "digest": "82960cb8f66f03dc8c62dc3b7f13db4c17225009b5e304bfe4b775c52db36e95"
      }
    ],
    "supportingResourceHashes": [],
    "manifestHash": {
      "algorithm": "sha256",
      "digest": "b4a084fd3e509d44d53efce008e64d7adcdee2648440fe932d4b6e7e3ae6c9a0"
    },
    "signature": {
      "signedBy": "risx-knowledge-compiler",
      "value": "d98572b28b01b5920fd3af27ee6e68326a8c6598fe4ab6f08fa07ca44b1baebf"
    },
    "compatibleWith": [
      "1.0.0"
    ],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "evidenceObjectIds": [
      "d11ae6ae-a375-4e35-91cb-43754429e029",
      "a3259eb7-a495-4d36-ab3d-49d47e199d47",
      "6b74ea27-f1e2-4b99-8c8e-8c152aed3f72",
      "c8f0c5ef-db4d-45d1-be40-9c98cc8aa1c1",
      "4f747cce-4906-4fa7-b525-cdf32d166391",
      "1ad0e941-8316-4f62-86c9-135aa0a56a5d",
      "cec98189-e4f2-4a83-bfea-bcec097f4ae6",
      "6d1c34ec-f09e-4757-8aaf-46055aeaa894",
      "1ac76f69-12e8-4592-9fdd-ebe518c27cf9",
      "210b3e19-fc48-4704-8f8e-2638b5e4cb32",
      "74f23b64-ca86-4a2d-93e0-d36be23a04f5",
      "abd07757-7f4c-45bf-ae64-20f06a2b73bb",
      "07cd5bbf-d5e3-43bc-941a-0fe62b3c9c17",
      "79a1847b-724c-40e6-956d-8264fe6a45b4",
      "a4016ee3-7deb-44c2-98cd-e250229b4389",
      "35a7349b-5bef-4786-9283-f091eec068e3",
      "45a7cb40-c75b-42e0-9668-48270b1f9f2a",
      "98ba1ea7-9ea7-4fa9-a950-c6439ec945bd",
      "84d0e1a6-0dc3-4fe5-b7b1-d9aaba858dbe",
      "4c85fffc-45b7-4ab2-8d8a-062eb3274fdb",
      "5282838e-fa74-4445-b9f1-5d12041daa3b",
      "326316af-7fb1-4435-82ce-31249caff8a2",
      "0b19d538-80a6-441d-b3ab-be2452fc8244",
      "7eb5a1be-b6fb-475d-b9da-019f8192038a",
      "1588cab2-40c3-42d4-b72d-515d987c69e8",
      "a0489abf-d340-47ed-acc4-a25bf7c955a9",
      "680cd012-86ae-400b-b613-cf1453cf30e6",
      "27a399c1-8524-4bd9-abe1-adc5de906713",
      "d07bb414-890f-4e0c-bf12-398e6eee4d6f",
      "4d4c7aa1-5921-4933-a985-39323baad00e",
      "0cf4f59c-6206-41f8-9412-84cb53133a74",
      "d12e0807-485b-428e-a3ca-3d5d31407939",
      "632dd60a-40bc-4012-b0cd-8f854015944e",
      "21432c0d-621f-43c9-9763-473acc4ad141",
      "02a2db42-ae18-4132-b3c1-9576ad0f311d",
      "04ff7963-5ba4-4184-819e-6e57797eab07",
      "a905c189-e8b6-48e9-a553-0be9ffd82185",
      "e0872f87-9209-44e5-97e3-1c92c1b5e649",
      "0674dc0e-49e9-418e-b4d4-d3e922e315e6",
      "3bcf7470-291b-4139-b907-83fab3b99a07",
      "83545fb2-0654-4371-bc03-60e786456977",
      "b6d69c2f-5771-484c-9303-dd5fddf9b0ab",
      "d9678afa-d4ce-4c48-ae66-a16a7e99440b",
      "e0975192-0534-4ede-9acc-5caf39cf5e23",
      "d11dbdb9-69d6-4584-af51-a1f7c0b2d89b",
      "d1543eb4-472c-451e-bfd5-f12aed62acd7",
      "0f7c56b3-f118-4d8c-954b-d1b2a5d045d7",
      "ae92825b-fd36-4cff-bf91-38ba960b35ba",
      "9799d158-8119-4b03-a474-6f01663122ef",
      "e9734791-b3b3-49c3-98c6-83a300fcc1b9",
      "e6bc3915-6a91-4dfe-837c-533128e6f0df",
      "836a11ab-7063-43b5-b860-dc86bb80a67e",
      "5f72fa9c-08cb-4c6b-8999-3067d6ab8e94",
      "2c85d190-6f3e-47cb-89c7-3b53e9c60d09",
      "4ab2141f-0322-400e-aa6c-c65756038c58",
      "3a13f50a-2c2a-42cf-a753-0d2ccbce54d9",
      "58a6d1cd-60fe-4a3d-9470-b596bf79ac07",
      "a617bf70-8bed-4690-acd7-1be5fe5cac29",
      "e5080aaf-7d71-4400-868c-0c87dc61aa4f",
      "ee46635b-08e5-4275-bea0-7f2203d6ca2f",
      "d999546c-d3d8-4294-8f59-8bfc9d928fb7",
      "a20eb7cf-9a4d-4329-9d44-a32db2c59675",
      "1f866359-178b-4174-8722-43ff59ef09e8",
      "c662b5da-dc27-48ca-8c0e-aab7c1ebd776",
      "309584f7-bda3-4afe-8702-83281f3667d6",
      "562c9940-f16e-461c-8510-03ec4eb698ea",
      "ecfc3479-d00b-47ff-8f24-1f13c76a7c0b",
      "a98b1250-25de-4d8d-8dd7-d19e1a00c99c",
      "69449581-7e25-473b-a6c9-e7da7dff167e",
      "0d155a32-19eb-4f3f-8661-20243bee7764",
      "0015741b-1789-4f93-a32f-a685c4b9af28",
      "08c5c2f4-0e22-46eb-b5fe-4a8b1300db7a",
      "c87e2684-0d81-4c2f-b9e5-1c229ee603cf",
      "6a73ae17-6acd-4f15-a78e-8530d33dcd31",
      "f1003949-4c99-4341-a188-ea444bdc293b"
    ],
    "provenancePointers": [
      "a76066a2497e32d65c83ee2cfdde834f9add8c3515c3b524f891af4cf2780fd5",
      "ad37a4d07e25adc861d830d4851a302a6718d1a5c983b8c49c6fbf0be4cf8294",
      "9407236bf96142d5237b4958129763b093be95f756ee8eec51a8be8800ca73e8",
      "803f8b3349868b3fe4ae5258f27684126bcb71be45f897966307c5b4e9151996",
      "40e6ac486de7e7db52444a9320476bfdb744d4cd2445a5458941396753306cbf",
      "79e1ca6197a59bc0594640d41202dac89d9986424b273d7cb6a9362efe44e3bb",
      "30dace7d7a5d81fa865d52e73db82896d8108c450e738f8dbcc2ad0796f404ce",
      "92f82558ff36c81ce3152eea89635bb11b6ae9d2113d32ee39e26721b2ccfcbc",
      "ec18381e922e9254380fd77fa528963bc5b37e77d2b156d905414b365d87f45e",
      "d5092901d2ed0a657b408e0296ffedffc04a3d83164b217a3a4571c19a69dc73",
      "90845ed73b30186f47730af8545da9530f4b2007dab5920720a16592d844db95",
      "2df35c1268cf596a0394cb1bbb42e83efece817c0301e549f75ae2d64d41bb7b",
      "1048d21811ea11aec6ef0362c36b9017ce907a87daa5393d5f3eafe74cf7c101",
      "47828eb047843c71f229bd54bee83feeafa6fd529a2fcf8cf243118b7ce54bce",
      "7f1e24cb9dbcc8426605e57aa387738907c7d3b210ffa88bae6a8898258c2fde",
      "d5e29bd394e3c419b867dc1e98c1072375227ff3f5bdb70e0a41cba528241426",
      "269151642b70747ae9250162e9ee61274dfe07ef908067d43c436f2031d0ca66",
      "bbd7cd73f541b1ca87c5af25bc9eb5d9ec76b3b842b8e6ed5a3c6777bc140ad5",
      "d1e452b0856fbb008662413cdbf343076f5f6804b972153b80421491a4e7b09e",
      "8e673d269c701fbf87d6604cd982faea3de7a581fdaeb6cc12df98d96714cf80",
      "e70d7d1819981babe03d4654860733739a13aa687026a70bb2a7cef19824de62",
      "eff40950c5a4c3477539320c4e4219ed6edbf26230f3a8cfbe53f838d08a0eb3",
      "ba7c6633d11d1919234a29198513460e1b3bbb46270fbe538acb444a10402a28",
      "59b392f8e9d97d5e98148a74a2ab0068cb6f3039e820dbf5e72e1ce48d55a7c3",
      "b8466cc4b4f397975eb74b5820070809197103e843a3e6e42f985196ea11010e",
      "29ba7a8f157e759a8eebf44fcb33c15b8de855918cd4627e21c33c7643c970eb",
      "7592a674195a94e93e5377d913173ddea681fc018d670df4997f351452f335a3",
      "36646c896d5f836e709e38636160ac80fda637d6468b4f2077db94ecb6f8f4b3",
      "645721db9304d0309c6526eae2aee41c48c1a8d49d7b865897653ef76f789dcc",
      "7a0f1a46775a5492fc6df0147e95bf376bbc744792130e08ea4e412e2a2edb0e",
      "040eae01599a057d10d8c6f49ac6a40336df25f00d4eb4bba4f0fb043966318c",
      "3e09f05fdded76b85fda73913d306bff685941a8d32d102856f821e3e7d289c4",
      "2ae80762ad6b0a70ff7b7ec72b080083d45d208a97b0eb304e90983669e94016",
      "deaddc5fcfdf27c54a9217ba1a0c679f627a85f33b5381a5b081068d7da72088",
      "efe2fe672d430beeabbf8641464f2edebd8e72b2d80e5611358e90386d3d7e2b",
      "860464c6cf576dcaa7fdd1220c9243f7f384dcb8641f0a5722450d655f67b53f",
      "1acc210ef4c7096f6a10ec5ffc1a4522cd6c74df8b7954a24ba3e05fa2195541",
      "4a2fc40d7a25e43a94c1fe174ae6eb860bc7bfeef63a668ccd09329038886224",
      "15b0be9443d731fd9c1e7531c6e31649f9ece446b58d3ecfac4cfa2fe22b7557",
      "9adaaa30dc689094489799be0aefbabe2645275ac5e25e90c3a97f35c2cd08ba",
      "deb0c4f0cf500ec317339594bcf1bc6e1798ed2e30b3e49cd217f9beb18dde8d",
      "488ec27e0ea2abdf280a36c19c7e7d646c1c8efa70b7001cc18cc561a7bb1893",
      "6afa6086064a8c1d89fd00827d0882374ca7cbd21df3fec8213d5eac388fbf6b",
      "e8d53b1ded49a8d4388542007112c79b0c77dac2b9f569abe3c50490ae6c508d",
      "7a3d8ab1111a6857b01d46db3d17a899cb2935e8bbb656fb640cf36d144e897a",
      "214ccf9105fedf900b91e23c286ae1a9d3918a56f6426d44cffce26f59e73a7d",
      "172e8a88f80930ba414b7d74862713992d5247ea47c8a462cf835299c3794a29",
      "fe887ae8bc53b45c91075f1a63b66d7be40c8b226fa5b3015c7f522b69e23e60",
      "c3492fb8ed7e2dbe449d233376db8a3b8e703d393917d6b729c985ac56d9cc96",
      "2e18b5cce2659010cd4396ba760339e9d189997e4b7155ccb8d27974d68f0849",
      "3a35f070a852bd11a6f00a6399b25993f8c57cc909812637298315565850e687",
      "11084c1bfbfa260fb7fb1b1fda24eec1e6e8bd8d778d96721fbeb328a3853eb8",
      "27b2596ec167864c1daa04f22bf8cdbb6c34c23da9c11d557edf81d03e57d8ce",
      "883852e98fa46d9e60b1bb2fad3011e834df273dd844adc17ab670b22ee29c55",
      "a8419786ce2d030ef31f4bc8985dab1441d5a5c8c6016c8a14c598ab8df8d788",
      "9a663ff40d4058e89883a62a06f4c12f4632d44e57a8988131535d3a1963f661",
      "6725c47c6f2ebf93ba9391fd0d117b5983258b703913b6ff6b319dc41d37aa28",
      "bd7ab4941ebafb98318b3bfd50df17d9263fd763d4b187e9f17b3d97ba2d88b9",
      "73f3c886491eb5b8f559d1f88cce7207d9c87dcd4333c92ff5d345265cae21bb",
      "ad92e6ee7124123230c71255c1e349c70aa8fa2b26494328296ccd1f032f007b",
      "06e7b7e35482f3a43cff0c0591b826b4ea1ce6f27c566619368e22e9001a7314",
      "9cb1d8d83ac834570823b117b28c20eac9528585cf49e5f5bb98db5f6e83b766",
      "946c58ad800aca3bc200d1edfe33c0f8aaf5a9209ce97d9944a3a8274b77491f",
      "caae8c70c65195726581a916c75c7253e12e5473578888f7cb9ca1adf54405b9",
      "025d4814bc799699902e4bee89ccc170bfe191834dd774577db29095c2d13996",
      "28dc6cb80eef26c8b1aa678d9fa86b893821b4bdf412ab9a7a29bba90e09358a",
      "3bfe6ff64e57ab1a6aa7e2a590c6abeb92285425a47a881115015331cd81306f",
      "5a6079ba8d52c1d76a56ad7537c53d1d97b44dcdd7feade784bdbde080d12580",
      "3ec4043c8dab29ae454580ca931314dd5db2e2406de267f180000e417fd727fc",
      "0e706f530800d6af7d5ab544eae812425f09a9c38f8f602bbe621d559bb7c031",
      "e770ac20079b8b37551ee553459fee7a4fc1ec8ddb715b32db82eab5c737bce6",
      "863847776664508a2f3f1f7f74f5769fd21b05771de7e6c1c41772ede267eb06",
      "25407dc16fd62cc3b2d809bd660f12260054fc982e6f4cd395fc51efca9e01bc",
      "e80f241b6c4093cbcaf7e5c8a010721ca959a96cbe63b91459ac65ec7838d63a",
      "e9ca153169584a4813c1f0b723d5bfd572f4e048169f6a203da314158baa264b"
    ]
  },
  "source": "Centers for Medicare & Medicaid Services",
  "assertions": [
    {
      "assertionId": "economic-J9045-2025-10-01",
      "evidenceCategory": "cms-medicare-economic-pricing",
      "claim": {
        "hcpcsCode": "J9045",
        "ndc": "00703-4239-01",
        "brandName": "Carboplatin",
        "paymentLimitMicroUsd": 2471000,
        "effectiveDate": "2025-10-01",
        "effectiveThrough": "2025-12-31",
        "source": "CMS-ASP-2025Q4"
      },
      "citation": "https://www.cms.gov/files/zip/october-2025-asp-pricing-final-file.zip; https://www.cms.gov/files/zip/october-2025-asp-ndc-hcpcs-crosswalk-final-file.zip"
    },
    {
      "assertionId": "economic-J9271-2025-10-01",
      "evidenceCategory": "cms-medicare-economic-pricing",
      "claim": {
        "hcpcsCode": "J9271",
        "ndc": "00006-3026-02",
        "brandName": "Keytruda",
        "paymentLimitMicroUsd": 60291000,
        "effectiveDate": "2025-10-01",
        "effectiveThrough": "2025-12-31",
        "source": "CMS-ASP-2025Q4"
      },
      "citation": "https://www.cms.gov/files/zip/october-2025-asp-pricing-final-file.zip; https://www.cms.gov/files/zip/october-2025-asp-ndc-hcpcs-crosswalk-final-file.zip"
    },
    {
      "assertionId": "economic-J9305-2025-10-01",
      "evidenceCategory": "cms-medicare-economic-pricing",
      "claim": {
        "hcpcsCode": "J9305",
        "ndc": "00002-7623-01",
        "brandName": "Alimta",
        "paymentLimitMicroUsd": 4355000,
        "effectiveDate": "2025-10-01",
        "effectiveThrough": "2025-12-31",
        "source": "CMS-ASP-2025Q4"
      },
      "citation": "https://www.cms.gov/files/zip/october-2025-asp-pricing-final-file.zip; https://www.cms.gov/files/zip/october-2025-asp-ndc-hcpcs-crosswalk-final-file.zip"
    }
  ]
};
