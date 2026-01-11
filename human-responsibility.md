# AI-Native 原则
1. 我们找的是day-one AI Native的人才，打心底相信AI在长期是比人强的，ai具有AGI的某种特性， 人和ai本质是一样的， 都是意识涌现的产物. 
1. 能用ai的地方都要用ai. 
1. take human is also agent， 但这个rules是针对人来进行优化的
2. 我们找到是主观能动性强， 会优化流程，优化工具链的. 
3. 我们要做的是OnePersonCompany, 人的主要工作就是当manager，制定流程，编写claude skill/promopt, 制定标准, 绩效考核， 以及管理ai agent， 调研新工具, 优化SOP流程, 简化运营难度. 
4. bottom line: 所有的代码都必须是ai写的. 一开始是人指导ai写，等到后期，是ai指导ai写，人就负责最后的验收. 
- ceo有三种规格的指令， 给出明确方向意见， 给出一票否决意见， 给出建设性意见。 三个level, 每个level对应不同的惩罚机制, 如果明确方向不执行会被抛弃ai所有的工作， 否定意见抛弃ai所有的工作， 建设性意见允许ai发散提出自己意见通过后可以继续执行(帮助ceo节省脑力， ceo可以专注于更重要的事情). 
- 一个任务经历， 想法阶段-讨论阶段-计划阶段-执行阶段-验收阶段
- less meeting, more notes, less oral reporting, more written reporting, async working pholosophy
- less maintenance burden policy, is the code or process matches same business goal but with less maintenance burden?
- is any space we can reduce some feature in order to get the space to optimize the system to have more maintainability and less congition burrdern?
- manage the company like a operating system.
- 

agains voice:
- 能赚钱就行搞这么多花里胡哨干嘛
- 你项目都不赚钱，先赚钱再说
- 

# Why we don't need human to write code
- ensure no low-level errors. 弥补人类实习生犯低级别代码规范和范式错误. 如果因为一个错误是因为人类手写代码带来的，严重扣分. 
- but ai can drastically reduce low-level, but it can't gurantee that it does't make such mistakes, we need additional mechanism to ensure, we will talk about this later. 
- one pain point, ai may change our fundamental data model or user journary flow in one random edit during the development, to prevent this, we need a centrialzied documentaiton to ensure that key component not change.
- documentaiton is the place that we align the consens between human engineers and ai engineers, documentation is for human-level readability.


# Human Responsibility
1. Plan the project in linear.
2. Review the code changes made by LLM
3. Test manually on the delivered code
4. code more maintainable and consistent., for example, use Enum, so try reuse enum as much as possible
5. ai native 公司的瓶颈就是ceo的理解能力，所以要做到项目要认知负担最小化， 宁愿更少的功能也不要增加更多的认知负担，每个功能认知负担增加一点随着功能数量的增加，整体将是乘数级别的运营压力和认知负担. 
6. 什么是认知负担？就是ceo记起来这个功能的构架并知道如何改动的最小认知负担. Complexity vs benefit 


# 对流程的改进
1. 需要对流程提出优化。
2. 遇到错误和bug，需要总结，并思考是否可以优化流程. 

# separation of concerns
1. 不同的模块干不同的事， 尽量不要讲不通的逻辑放在一个模块中。避免代码耦合过于严重. 



# 惩罚机制
1. 第一次p0事故， 需要写反省报告，并且扣除奖金， 第二次p0事故